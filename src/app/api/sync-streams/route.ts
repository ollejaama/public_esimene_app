import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getValidAccessToken, getHRStream, getGPSStream, getLaps } from '@/lib/strava/api'
import { setSyncProgress, clearSyncProgress } from '@/lib/sync/store'

const RATE_LIMIT_THRESHOLD = 85
const RATE_LIMIT_WAIT_SEC = 60

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const force = searchParams.get('force') === 'true'
  const { userId } = session

  runStreamsSync(userId, force).catch(console.error)

  return NextResponse.json({ ok: true, message: 'Streams sync started' })
}

async function runStreamsSync(userId: string, force: boolean): Promise<void> {
  const db = createServiceClient()

  clearSyncProgress(userId)
  setSyncProgress(userId, { status: 'running', message: 'Loading activities…' })

  try {
    // Fetch all activities for this user from DB
    const { data: allActivities } = await db
      .from('activities')
      .select('id, strava_id, has_hr_data, has_gps_data')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    if (!allActivities || allActivities.length === 0) {
      setSyncProgress(userId, { status: 'complete', message: 'No activities found.' })
      return
    }

    const total = allActivities.length
    let hrFetched = 0
    let gpsFetched = 0
    let lapsFetched = 0
    let processed = 0

    for (const act of allActivities) {
      const token = await getValidAccessToken(userId)

      if (force) {
        // Delete existing streams so they get re-fetched
        await Promise.all([
          db.from('activity_hr_streams').delete().eq('activity_id', act.id),
          db.from('activity_gps_streams').delete().eq('activity_id', act.id),
          db.from('activity_laps').delete().eq('activity_id', act.id),
        ])
      }

      // HR stream
      if (act.has_hr_data) {
        const { data: existingHR } = await db
          .from('activity_hr_streams')
          .select('id')
          .eq('activity_id', act.id)
          .maybeSingle()

        if (!existingHR) {
          const hrData = await getHRStream(token, act.strava_id)
          if (hrData) {
            await db.from('activity_hr_streams').upsert({
              activity_id: act.id,
              user_id: userId,
              hr_data: hrData,
            }, { onConflict: 'activity_id' })
            hrFetched++
          }
        }
      }

      // GPS stream
      if (act.has_gps_data) {
        const { data: existingGPS } = await db
          .from('activity_gps_streams')
          .select('id')
          .eq('activity_id', act.id)
          .maybeSingle()

        if (!existingGPS) {
          const gpsResult = await getGPSStream(token, act.strava_id)
          if (gpsResult) {
            await db.from('activity_gps_streams').upsert({
              activity_id: act.id,
              user_id: userId,
              latlng_data: gpsResult.latlng,
              elevation_data: gpsResult.elevation ?? null,
            }, { onConflict: 'activity_id' })
            gpsFetched++
          }
        }
      }

      // Laps
      const { data: existingLap } = await db
        .from('activity_laps')
        .select('id')
        .eq('activity_id', act.id)
        .limit(1)
        .maybeSingle()

      if (!existingLap) {
        const lapsData = await getLaps(token, act.strava_id)
        if (lapsData && lapsData.length > 0) {
          await db.from('activity_laps').upsert(
            lapsData.map((l) => ({
              activity_id: act.id,
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

      processed++

      // Check rate limit via a dummy token refresh which returns current usage
      // We do a simple count-based throttle: pause after every 25 activities
      if (processed % 25 === 0) {
        setSyncProgress(userId, {
          status: 'rate_limited',
          message: `Processed ${processed}/${total} — pausing briefly…`,
          rateLimitCountdown: RATE_LIMIT_WAIT_SEC,
          hrStreamsFetched: hrFetched,
          gpsStreamsFetched: gpsFetched,
          lapsFetched,
        })
        await countdown(userId, RATE_LIMIT_WAIT_SEC)
        setSyncProgress(userId, { status: 'running', rateLimitCountdown: 0 })
      }

      setSyncProgress(userId, {
        activitiesSynced: processed,
        totalEstimate: total,
        hrStreamsFetched: hrFetched,
        gpsStreamsFetched: gpsFetched,
        lapsFetched,
        message: `${processed}/${total} — ${hrFetched} HR, ${gpsFetched} GPS, ${lapsFetched} laps`,
      })
    }

    setSyncProgress(userId, {
      status: 'complete',
      activitiesSynced: processed,
      hrStreamsFetched: hrFetched,
      gpsStreamsFetched: gpsFetched,
      lapsFetched,
      message: `Streams sync complete — ${hrFetched} HR, ${gpsFetched} GPS, ${lapsFetched} laps`,
    })
  } catch (err) {
    console.error('Streams sync error:', err)
    setSyncProgress(userId, {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
      message: 'Streams sync failed',
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
