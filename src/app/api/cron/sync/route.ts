import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getValidAccessToken, getActivities, getHRStream, getGPSStream, getLaps } from '@/lib/strava/api'

export const dynamic = 'force-dynamic'
// 5 minutes: enough for sequential per-athlete incremental syncs.
export const maxDuration = 300

const BATCH_SIZE = 50

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Vercel sends Authorization: Bearer <CRON_SECRET> on scheduled invocations.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const db = createServiceClient()

  // Fetch all athletes who have a Strava connection.
  const { data: profiles, error } = await db
    .from('profiles')
    .select('user_id, last_synced_at, strava_refresh_token')
    .not('strava_refresh_token', 'is', null)
    .neq('strava_refresh_token', '')

  if (error) {
    console.error('Cron: failed to fetch profiles:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const results: { userId: string; synced: number; skipped: boolean; error?: string }[] = []

  for (const profile of profiles ?? []) {
    const result = await syncAthleteIncremental(profile.user_id, profile.last_synced_at)
    results.push(result)
    // Small pause between athletes to spread rate-limit headroom.
    await sleep(200)
  }

  const totalSynced = results.reduce((s, r) => s + r.synced, 0)
  const skipped = results.filter((r) => r.skipped).length
  console.log(`Cron sync complete: ${totalSynced} activities across ${results.length - skipped} athletes (${skipped} skipped)`)

  return NextResponse.json({ ok: true, athletes: results.length, skipped, totalSynced })
}

async function syncAthleteIncremental(
  userId: string,
  lastSyncedAt: string | null,
): Promise<{ userId: string; synced: number; skipped: boolean; error?: string }> {
  const db = createServiceClient()

  let token: string
  try {
    token = await getValidAccessToken(userId)
  } catch (err) {
    // Refresh token is expired or missing — skip this athlete.
    return { userId, synced: 0, skipped: true, error: 'token_invalid' }
  }

  // Default to 25 hours ago so we never miss activities even if cron fires slightly late.
  const after = lastSyncedAt
    ? Math.floor(new Date(lastSyncedAt).getTime() / 1000)
    : Math.floor((Date.now() - 25 * 3600 * 1000) / 1000)

  const { data: deletedRows } = await db
    .from('deleted_activities')
    .select('strava_id')
    .eq('user_id', userId)
  const deletedIds = new Set((deletedRows ?? []).map((r) => r.strava_id))

  let totalSynced = 0
  let page = 1

  try {
    while (true) {
      const { activities } = await getActivities(token, { after, page, perPage: BATCH_SIZE })
      if (activities.length === 0) break

      const batch = activities.filter((a) => !deletedIds.has(a.id))

      if (batch.length > 0) {
        const { error: upsertError } = await db.from('activities').upsert(
          batch.map((a) => ({
            user_id: userId,
            strava_id: a.id,
            name: a.name,
            sport_type: a.sport_type,
            start_date: a.start_date,
            elapsed_time: a.elapsed_time,
            moving_time: a.moving_time ?? null,
            distance: a.distance ?? 0,
            average_hr: a.average_heartrate ?? null,
            max_hr: a.max_heartrate ?? null,
            average_speed: a.average_speed ?? null,
            max_speed: a.max_speed ?? null,
            average_cadence: a.average_cadence ?? null,
            total_elevation_gain: a.total_elevation_gain ?? null,
            has_hr_data: a.has_heartrate && (a.average_heartrate ?? 0) > 0,
            has_gps_data: !!(a.map?.summary_polyline),
          })),
          { onConflict: 'user_id,strava_id' }
        )
        if (upsertError) throw new Error(upsertError.message)
        totalSynced += batch.length

        // Fetch streams for each new/updated activity.
        for (const activity of batch) {
          const { data: actRow } = await db
            .from('activities')
            .select('id')
            .eq('user_id', userId)
            .eq('strava_id', activity.id)
            .single()
          if (!actRow) continue

          if (activity.has_heartrate && (activity.average_heartrate ?? 0) > 0) {
            const { data: existingHR } = await db
              .from('activity_hr_streams')
              .select('id')
              .eq('activity_id', actRow.id)
              .maybeSingle()
            if (!existingHR) {
              const hrData = await getHRStream(token, activity.id)
              if (hrData) {
                await db.from('activity_hr_streams').upsert(
                  { activity_id: actRow.id, user_id: userId, hr_data: hrData },
                  { onConflict: 'activity_id' }
                )
              }
            }
          }

          if (activity.map?.summary_polyline) {
            const { data: existingGPS } = await db
              .from('activity_gps_streams')
              .select('id')
              .eq('activity_id', actRow.id)
              .maybeSingle()
            if (!existingGPS) {
              const gpsResult = await getGPSStream(token, activity.id)
              if (gpsResult) {
                await db.from('activity_gps_streams').upsert(
                  {
                    activity_id: actRow.id,
                    user_id: userId,
                    latlng_data: gpsResult.latlng,
                    elevation_data: gpsResult.elevation ?? null,
                  },
                  { onConflict: 'activity_id' }
                )
              }
            }
          }

          const { data: existingLap } = await db
            .from('activity_laps')
            .select('id')
            .eq('activity_id', actRow.id)
            .limit(1)
            .maybeSingle()
          if (!existingLap) {
            const laps = await getLaps(token, activity.id)
            if (laps && laps.length > 0) {
              await db.from('activity_laps').upsert(
                laps.map((l) => ({
                  activity_id: actRow.id,
                  user_id: userId,
                  lap_index: l.lap_index,
                  distance: l.distance ?? 0,
                  elapsed_time: l.elapsed_time,
                  moving_time: l.moving_time ?? null,
                  average_speed: l.average_speed ?? null,
                  average_hr: l.average_heartrate ?? null,
                  max_hr: l.max_heartrate ?? null,
                })),
                { onConflict: 'activity_id,lap_index' }
              )
            }
          }
        }
      }

      if (activities.length < BATCH_SIZE) break
      page++
    }

    // Update last_synced_at only after a clean pass.
    await db
      .from('profiles')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', userId)

    return { userId, synced: totalSynced, skipped: false }
  } catch (err) {
    console.error(`Cron: sync failed for user ${userId}:`, err)
    return { userId, synced: totalSynced, skipped: false, error: err instanceof Error ? err.message : 'unknown' }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
