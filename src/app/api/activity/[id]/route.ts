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
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const [{ data: activity }, { data: hrStream }, { data: gpsStream }, { data: zoneData }, { data: laps }] =
    await Promise.all([
      db.from('activities').select('*').eq('id', params.id).eq('user_id', session.userId).single(),
      db.from('activity_hr_streams').select('*').eq('activity_id', params.id).maybeSingle(),
      db.from('activity_gps_streams').select('*').eq('activity_id', params.id).maybeSingle(),
      db.from('hr_zone_settings').select('*').eq('user_id', session.userId).maybeSingle(),
      db.from('activity_laps').select('*').eq('activity_id', params.id).order('lap_index'),
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
  })
}
