import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getValidAccessToken, getActivities, getHRStream, getGPSStream, getLaps } from '@/lib/strava/api'
import { setSyncProgress, clearSyncProgress } from '@/lib/sync/store'

const BATCH_SIZE = 50
const RATE_LIMIT_THRESHOLD = 85  // pause if we've used this many requests per 15min
const RATE_LIMIT_WAIT_SEC = 60   // wait 60s when rate limited

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceClient()
  const { data } = await db
    .from('profiles')
    .select('last_synced_at')
    .eq('user_id', session.userId)
    .single()
  return NextResponse.json({ lastSyncedAt: data?.last_synced_at ?? null })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode') ?? 'incremental'  // 'full' | 'incremental'
  const { userId } = session

  // Run sync in background — respond immediately, progress tracked via SSE
  runSync(userId, mode === 'full').catch(console.error)

  return NextResponse.json({ ok: true, message: 'Sync started' })
}

async function runSync(userId: string, fullSync: boolean): Promise<void> {
  const db = createServiceClient()

  clearSyncProgress(userId)
  setSyncProgress(userId, { status: 'running', message: 'Starting sync…' })

  try {
    // Get last sync time for incremental
    let after: number | undefined
    if (!fullSync) {
      const { data: profile } = await db
        .from('profiles')
        .select('last_synced_at')
        .eq('user_id', userId)
        .single()
      if (profile?.last_synced_at) {
        after = Math.floor(new Date(profile.last_synced_at).getTime() / 1000)
      }
    }

    let page = 1
    let totalSynced = 0
    let hrFetched = 0
    let gpsFetched = 0
    let lapsFetched = 0
    let skipped = 0

    while (true) {
      const accessToken = await getValidAccessToken(userId)
      const { activities, rateLimitUsage, rateLimitLimit } = await getActivities(accessToken, {
        after,
        page,
        perPage: BATCH_SIZE,
      })

      if (activities.length === 0) break

      setSyncProgress(userId, {
        message: `Syncing page ${page} (${activities.length} activities)…`,
        activitiesSynced: totalSynced,
      })

      // Check rate limit
      if (rateLimitUsage >= RATE_LIMIT_THRESHOLD) {
        setSyncProgress(userId, {
          status: 'rate_limited',
          message: `Rate limit reached (${rateLimitUsage}/${rateLimitLimit}). Pausing…`,
          rateLimitCountdown: RATE_LIMIT_WAIT_SEC,
        })
        await countdown(userId, RATE_LIMIT_WAIT_SEC)
        setSyncProgress(userId, { status: 'running', rateLimitCountdown: 0 })
      }

      // Upsert activities
      const activityRows = activities.map((a) => ({
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
      }))

      await db.from('activities').upsert(activityRows, { onConflict: 'user_id,strava_id' })
      totalSynced += activities.length

      // Fetch streams for each activity
      for (const activity of activities) {
        // Re-check access token freshness for each stream batch
        const token = await getValidAccessToken(userId)

        // Look up internal activity ID once, reuse for all stream types
        const { data: actRow } = await db
          .from('activities')
          .select('id')
          .eq('user_id', userId)
          .eq('strava_id', activity.id)
          .single()

        if (actRow) {
          if (activity.has_heartrate && (activity.average_heartrate ?? 0) > 0) {
            const { data: existingHR } = await db
              .from('activity_hr_streams')
              .select('id')
              .eq('activity_id', actRow.id)
              .maybeSingle()

            if (!existingHR) {
              const hrData = await getHRStream(token, activity.id)
              if (hrData) {
                await db.from('activity_hr_streams').upsert({
                  activity_id: actRow.id,
                  user_id: userId,
                  hr_data: hrData,
                }, { onConflict: 'activity_id' })
                hrFetched++
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
                await db.from('activity_gps_streams').upsert({
                  activity_id: actRow.id,
                  user_id: userId,
                  latlng_data: gpsResult.latlng,
                  elevation_data: gpsResult.elevation ?? null,
                }, { onConflict: 'activity_id' })
                gpsFetched++
              }
            }
          }

          // Fetch laps if not already stored
          const { data: existingLaps } = await db
            .from('activity_laps')
            .select('id')
            .eq('activity_id', actRow.id)
            .limit(1)
            .maybeSingle()

          if (!existingLaps) {
            const lapsData = await getLaps(token, activity.id)
            if (lapsData && lapsData.length > 0) {
              await db.from('activity_laps').upsert(
                lapsData.map((l) => ({
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
              lapsFetched++
            }
          }
        }

        setSyncProgress(userId, {
          activitiesSynced: totalSynced,
          hrStreamsFetched: hrFetched,
          gpsStreamsFetched: gpsFetched,
          lapsFetched,
          activitiesSkipped: skipped,
          message: `Synced ${totalSynced} activities, ${hrFetched} HR, ${gpsFetched} GPS, ${lapsFetched} laps`,
        })
      }

      if (activities.length < BATCH_SIZE) break

      page++
      // 1s delay between batches
      await sleep(1000)
    }

    // Update last_synced_at
    await db
      .from('profiles')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', userId)

    setSyncProgress(userId, {
      status: 'complete',
      activitiesSynced: totalSynced,
      hrStreamsFetched: hrFetched,
      gpsStreamsFetched: gpsFetched,
      lapsFetched,
      activitiesSkipped: skipped,
      message: `Sync complete — ${totalSynced} activities, ${hrFetched} HR, ${gpsFetched} GPS, ${lapsFetched} laps`,
    })
  } catch (err) {
    console.error('Sync error:', err)
    setSyncProgress(userId, {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
      message: 'Sync failed',
    })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function countdown(userId: string, seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    setSyncProgress(userId, { rateLimitCountdown: i })
    await sleep(1000)
  }
}
