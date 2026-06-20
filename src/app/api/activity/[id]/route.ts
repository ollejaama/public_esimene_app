import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { computeHRZoneSeconds, zoneSecondsToRows } from '@/lib/analytics/hrZones'
import { HRZoneSettings } from '@/lib/supabase/types'
import { effectiveDuration } from '@/lib/activity'

const DEFAULT_ZONES: HRZoneSettings = {
  id: '', user_id: '', updated_at: '',
  zone1_max: 130, zone2_max: 148, zone3_max: 162, zone4_max: 174,
  zone1_name: 'I1', zone2_name: 'I2', zone3_name: 'I3', zone4_name: 'I4', zone5_name: 'I5',
  rest_day_threshold_minutes: 0,
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Coach can view an athlete's activity by passing ?viewAs=athleteUserId
  const viewAs = req.nextUrl.searchParams.get('viewAs')
  let targetUserId = session.userId
  if (viewAs) {
    if (session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data: link } = await db
      .from('coach_athlete_links')
      .select('athlete_id')
      .eq('coach_id', session.userId)
      .eq('athlete_id', viewAs)
      .maybeSingle()
    if (!link) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    targetUserId = viewAs
  }

  const [{ data: activity }, { data: hrStream }, { data: gpsStream }, { data: zoneData }, { data: laps }, { data: lactate }, { data: intervalSets }] =
    await Promise.all([
      db.from('activities').select('*').eq('id', params.id).eq('user_id', targetUserId).single(),
      db.from('activity_hr_streams').select('*').eq('activity_id', params.id).maybeSingle(),
      db.from('activity_gps_streams').select('*').eq('activity_id', params.id).maybeSingle(),
      db.from('hr_zone_settings').select('*').eq('user_id', targetUserId).maybeSingle(),
      db.from('activity_laps').select('*').eq('activity_id', params.id).order('lap_index'),
      db.from('lactate_measurements').select('*').eq('activity_id', params.id).eq('user_id', targetUserId).order('created_at'),
      db.from('interval_sets').select('*').eq('activity_id', params.id).order('set_order'),
    ])

  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const zones: HRZoneSettings = zoneData ?? DEFAULT_ZONES
  const activitySeconds = effectiveDuration(activity)
  const zoneSeconds = hrStream ? computeHRZoneSeconds(hrStream.hr_data, zones, activitySeconds) : { z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  const zoneRows = zoneSecondsToRows(zoneSeconds, zones)

  return NextResponse.json({
    activity,
    zoneRows,
    latlng: gpsStream?.latlng_data ?? null,
    elevation: gpsStream?.elevation_data ?? null,
    hrData: hrStream?.hr_data ?? null,
    laps: laps ?? [],
    lactate: lactate ?? [],
    intervalSets: intervalSets ?? [],
    zoneBoundaries: {
      zone1_max: zones.zone1_max,
      zone2_max: zones.zone2_max,
      zone3_max: zones.zone3_max,
      zone4_max: zones.zone4_max,
    },
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const { data: activity } = await db
    .from('activities')
    .select('strava_id')
    .eq('id', params.id)
    .eq('user_id', session.userId)
    .single()

  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.from('activities').delete().eq('id', params.id).eq('user_id', session.userId)

  if (activity.strava_id != null) {
    await db.from('deleted_activities').upsert(
      { user_id: session.userId, strava_id: activity.strava_id },
      { onConflict: 'user_id,strava_id' }
    )
  }

  return NextResponse.json({ ok: true })
}
