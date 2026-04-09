import { AppShell } from '@/components/layout/AppShell'
import { ActivityStatsPanel } from '@/components/activities/ActivityStatsPanel'
import { HRZoneTableActivity } from '@/components/activities/HRZoneTableActivity'
import { GPSMap } from '@/components/activities/GPSMap'
import { SportTagSelector } from '@/components/activities/SportTagSelector'
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

  const [{ data: activity }, { data: hrStream }, { data: gpsStream }, { data: zoneData }] =
    await Promise.all([
      db.from('activities').select('*').eq('id', params.id).eq('user_id', session.userId).single(),
      db.from('activity_hr_streams').select('*').eq('activity_id', params.id).maybeSingle(),
      db.from('activity_gps_streams').select('*').eq('activity_id', params.id).maybeSingle(),
      db.from('hr_zone_settings').select('*').eq('user_id', session.userId).maybeSingle(),
    ])

  if (!activity) notFound()

  const zones: HRZoneSettings = zoneData ?? DEFAULT_ZONES
  const zoneSeconds = hrStream
    ? computeHRZoneSeconds(hrStream.hr_data, zones)
    : { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  const zoneRows = zoneSecondsToRows(zoneSeconds, zones)

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/activities" className="text-xs text-gray-400 hover:text-gray-600">
          ← Back to Activities
        </Link>
      </div>

      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">{activity.name}</h1>
          <SportTagSelector activityId={activity.id} currentTag={activity.custom_sport_tag} sportType={activity.sport_type} />
        </div>

        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Stats</h2>
          <ActivityStatsPanel activity={activity} />
        </div>

        {zoneRows.some((z) => z.seconds > 0) && (
          <div className="border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">HR Zones</h2>
            <HRZoneTableActivity zones={zoneRows} />
          </div>
        )}

        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Route</h2>
          <GPSMap latlng={gpsStream?.latlng_data ?? []} />
        </div>
      </div>
    </AppShell>
  )
}
