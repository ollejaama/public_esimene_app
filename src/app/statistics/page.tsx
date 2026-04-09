import { AppShell } from '@/components/layout/AppShell'
import { TimeRangeSelector, TimeRange } from '@/components/statistics/TimeRangeSelector'
import { VolumeBarChart } from '@/components/statistics/VolumeBarChart'
import { HRZoneDonutChart } from '@/components/statistics/HRZoneDonutChart'
import { SportBreakdownTable } from '@/components/statistics/SportBreakdownTable'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { HRZoneSettings } from '@/lib/supabase/types'
import { groupByWeek, getAllSportsFromActivities } from '@/lib/analytics/volumeByWeek'
import { aggregateWeek } from '@/lib/analytics/weekSummary'
import { zoneSecondsToRows } from '@/lib/analytics/hrZones'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Statistics — Training Analytics' }

const DEFAULT_ZONES: HRZoneSettings = {
  id: '', user_id: '', updated_at: '',
  zone1_max: 130, zone2_max: 148, zone3_max: 162, zone4_max: 174,
  zone1_name: 'I1', zone2_name: 'I2', zone3_name: 'I3', zone4_name: 'I4', zone5_name: 'I5',
}

function getDateRange(range: TimeRange, offset: number): { start: Date; end: Date; label: string } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (range === 'week') {
    const dow = (now.getDay() + 6) % 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - dow + offset * 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 7)
    const weekNum = Math.ceil((((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
    return { start: monday, end: sunday, label: `W${weekNum} ${monday.getFullYear()}` }
  }

  if (range === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    return {
      start: d,
      end,
      label: d.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    }
  }

  if (range === 'year') {
    const year = now.getFullYear() + offset
    return {
      start: new Date(year, 0, 1),
      end: new Date(year + 1, 0, 1),
      label: String(year),
    }
  }

  // all
  return { start: new Date(2000, 0, 1), end: new Date(2099, 0, 1), label: 'All time' }
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: { range?: string; offset?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/')

  const range = (searchParams.range ?? 'month') as TimeRange
  const offset = parseInt(searchParams.offset ?? '0')

  const { start, end, label } = getDateRange(range, offset)

  const db = createServiceClient()

  // For volume chart: fetch last 12 weeks/months or all activities
  const chartStart = range === 'week'
    ? new Date(start.getTime() - 11 * 7 * 86400000)  // 12 weeks back
    : range === 'month'
    ? new Date(start.getFullYear(), start.getMonth() - 11, 1)  // 12 months back
    : start

  const [{ data: chartActivities }, { data: rangeActivities }, { data: zoneData }] = await Promise.all([
    db.from('activities')
      .select('*')
      .eq('user_id', session.userId)
      .gte('start_date', chartStart.toISOString())
      .lt('start_date', end.toISOString())
      .order('start_date', { ascending: true }),
    db.from('activities')
      .select('*')
      .eq('user_id', session.userId)
      .gte('start_date', start.toISOString())
      .lt('start_date', end.toISOString()),
    db.from('hr_zone_settings').select('*').eq('user_id', session.userId).maybeSingle(),
  ])

  const zones: HRZoneSettings = zoneData ?? DEFAULT_ZONES

  // HR streams for the selected range
  const hrActivityIds = (rangeActivities ?? []).filter((a) => a.has_hr_data).map((a) => a.id)
  const { data: streams } = hrActivityIds.length > 0
    ? await db.from('activity_hr_streams').select('*').in('activity_id', hrActivityIds)
    : { data: [] }

  const sports = getAllSportsFromActivities(chartActivities ?? [])
  const volumeData = groupByWeek(chartActivities ?? [], sports)
  const summary = aggregateWeek(rangeActivities ?? [], streams ?? [], zones)
  const zoneRows = zoneSecondsToRows(summary.zoneSeconds, zones)

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Statistics</h1>
      </div>

      <TimeRangeSelector current={range} offset={offset} periodLabel={label} />

      <div className="space-y-6">
        {/* Volume chart */}
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Training Volume (hours)
          </h2>
          <VolumeBarChart data={volumeData} sports={sports} />
        </div>

        {/* Sport breakdown + HR zones */}
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Sport Breakdown
            </h2>
            <SportBreakdownTable bySport={summary.bySport} />
          </div>

          <div className="border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              HR Zone Distribution
            </h2>
            <HRZoneDonutChart zones={zoneRows} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
