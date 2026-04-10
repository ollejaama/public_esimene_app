import { AppShell } from '@/components/layout/AppShell'
import { ActivityDetailClient } from '@/components/activities/ActivityDetailClient'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { computeHRZoneSeconds, zoneSecondsToRows } from '@/lib/analytics/hrZones'
import { HRZoneSettings } from '@/lib/supabase/types'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const DEFAULT_ZONES: HRZoneSettings = {
  id: '', user_id: '', updated_at: '',
  zone1_max: 130, zone2_max: 148, zone3_max: 162, zone4_max: 174,
  zone1_name: 'I1', zone2_name: 'I2', zone3_name: 'I3', zone4_name: 'I4', zone5_name: 'I5',
}

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/')

  const db = createServiceClient()

  const [{ data: activity }, { data: hrStream }, { data: gpsStream }, { data: zoneData }, { data: laps }] =
    await Promise.all([
      db.from('activities').select('*').eq('id', params.id).eq('user_id', session.userId).single(),
      db.from('activity_hr_streams').select('*').eq('activity_id', params.id).maybeSingle(),
      db.from('activity_gps_streams').select('*').eq('activity_id', params.id).maybeSingle(),
      db.from('hr_zone_settings').select('*').eq('user_id', session.userId).maybeSingle(),
      db.from('activity_laps').select('*').eq('activity_id', params.id).order('lap_index'),
    ])

  if (!activity) notFound()

  const zones: HRZoneSettings = zoneData ?? DEFAULT_ZONES
  const zoneSeconds = hrStream
    ? computeHRZoneSeconds(hrStream.hr_data, zones)
    : { z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  const zoneRows = zoneSecondsToRows(zoneSeconds, zones)

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/activities" className="text-xs text-gray-400 hover:text-gray-600">
          ← Back to Activities
        </Link>
      </div>

      <ActivityDetailClient
        activity={activity}
        zoneRows={zoneRows}
        latlng={gpsStream?.latlng_data ?? []}
        hrData={hrStream?.hr_data ?? null}
        laps={laps ?? []}
      />
    </AppShell>
  )
}
