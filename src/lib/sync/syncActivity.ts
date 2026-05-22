import { createServiceClient } from '@/lib/supabase/server'
import { getValidAccessToken, getActivity, getHRStream, getGPSStream, getLaps } from '@/lib/strava/api'
import { StravaActivity } from '@/lib/strava/types'

function activityToRow(userId: string, a: StravaActivity) {
  return {
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
  }
}

async function storeStreamsAndLaps(
  userId: string,
  internalActivityId: string,
  stravaActivityId: number,
  activity: StravaActivity,
  token: string,
): Promise<void> {
  const db = createServiceClient()

  if (activity.has_heartrate && (activity.average_heartrate ?? 0) > 0) {
    const { data: existing } = await db
      .from('activity_hr_streams')
      .select('id')
      .eq('activity_id', internalActivityId)
      .maybeSingle()
    if (!existing) {
      const hrData = await getHRStream(token, stravaActivityId)
      if (hrData) {
        await db.from('activity_hr_streams').upsert(
          { activity_id: internalActivityId, user_id: userId, hr_data: hrData },
          { onConflict: 'activity_id' }
        )
      }
    }
  }

  if (activity.map?.summary_polyline) {
    const { data: existing } = await db
      .from('activity_gps_streams')
      .select('id')
      .eq('activity_id', internalActivityId)
      .maybeSingle()
    if (!existing) {
      const gpsResult = await getGPSStream(token, stravaActivityId)
      if (gpsResult) {
        await db.from('activity_gps_streams').upsert(
          {
            activity_id: internalActivityId,
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
    .eq('activity_id', internalActivityId)
    .limit(1)
    .maybeSingle()
  if (!existingLap) {
    const laps = await getLaps(token, stravaActivityId)
    if (laps && laps.length > 0) {
      await db.from('activity_laps').upsert(
        laps.map((l) => ({
          activity_id: internalActivityId,
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

// Fetch one Strava activity and store it with streams and laps.
// Used for webhook create and update events.
export async function syncSingleActivity(userId: string, stravaActivityId: number): Promise<void> {
  const db = createServiceClient()
  const token = await getValidAccessToken(userId)
  const activity = await getActivity(token, stravaActivityId)
  if (!activity) return

  await db.from('activities').upsert(
    activityToRow(userId, activity),
    { onConflict: 'user_id,strava_id' }
  )

  const { data: actRow } = await db
    .from('activities')
    .select('id')
    .eq('user_id', userId)
    .eq('strava_id', stravaActivityId)
    .single()

  if (actRow) {
    await storeStreamsAndLaps(userId, actRow.id, stravaActivityId, activity, token)
  }
}

// Mark a Strava activity as deleted. Used for webhook delete events.
export async function deleteStravaActivity(userId: string, stravaActivityId: number): Promise<void> {
  const db = createServiceClient()
  await db
    .from('activities')
    .update({ hidden: true })
    .eq('user_id', userId)
    .eq('strava_id', stravaActivityId)
  await db.from('deleted_activities').upsert(
    { user_id: userId, strava_id: stravaActivityId },
    { onConflict: 'user_id,strava_id', ignoreDuplicates: true }
  )
}
