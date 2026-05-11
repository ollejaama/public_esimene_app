import { AppShell } from '@/components/layout/AppShell'
import { TimeRangeSelector, TimeRange } from '@/components/statistics/TimeRangeSelector'
import { VolumeBarChart } from '@/components/statistics/VolumeBarChart'
import { HRZoneDonutChart } from '@/components/statistics/HRZoneDonutChart'
import { SportBreakdownTable } from '@/components/statistics/SportBreakdownTable'
import { IntensityBreakdown } from '@/components/statistics/IntensityBreakdown'
import { RestDaysWidget } from '@/components/statistics/RestDaysWidget'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { HRZoneSettings } from '@/lib/supabase/types'
import { groupByWeek, groupByDay, groupByMonth, getAllSportsFromActivities } from '@/lib/analytics/volumeByWeek'
import { aggregateWeek } from '@/lib/analytics/weekSummary'
import { zoneSecondsToRows } from '@/lib/analytics/hrZones'
import { effectiveContributionSeconds } from '@/lib/activity'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Statistics — Training Analytics' }

const DEFAULT_ZONES: HRZoneSettings = {
  id: '', user_id: '', updated_at: '',
  zone1_max: 130, zone2_max: 148, zone3_max: 162, zone4_max: 174,
  zone1_name: 'I1', zone2_name: 'I2', zone3_name: 'I3', zone4_name: 'I4', zone5_name: 'I5',
  rest_day_threshold_minutes: 0,
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

function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: { range?: string; offset?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/')

  const range = (searchParams.range ?? 'week') as TimeRange
  const offset = parseInt(searchParams.offset ?? '0')

  const { start, end, label } = getDateRange(range, offset)

  const db = createServiceClient()

  const [{ data: chartActivities }, { data: rangeActivities }, { data: zoneData }] = await Promise.all([
    db.from('activities')
      .select('*')
      .eq('user_id', session.userId)
      .eq('hidden', false)
      .gte('start_date', start.toISOString())
      .lt('start_date', end.toISOString())
      .order('start_date', { ascending: true }),
    db.from('activities')
      .select('*')
      .eq('user_id', session.userId)
      .eq('hidden', false)
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

  let volumeData
  if (range === 'week') {
    volumeData = groupByDay(chartActivities ?? [], start, end, 'weekday', sports)
  } else if (range === 'month') {
    volumeData = groupByDay(chartActivities ?? [], start, end, 'daynum', sports)
  } else if (range === 'year') {
    volumeData = groupByMonth(chartActivities ?? [], start.getFullYear(), sports)
  } else {
    volumeData = groupByWeek(chartActivities ?? [], sports)
  }

  const summary = aggregateWeek(rangeActivities ?? [], streams ?? [], zones)
  const zoneRows = zoneSecondsToRows(summary.zoneSeconds, zones)

  const totalSeconds = (rangeActivities ?? []).reduce(
    (sum, a) => sum + effectiveContributionSeconds(a), 0
  )
  const totalH = Math.floor(totalSeconds / 3600)
  const totalM = Math.round((totalSeconds % 3600) / 60)
  const totalHoursLabel = totalM > 0 ? `${totalH}h ${totalM}m` : `${totalH}h`

  // Compute rest days: group activities by calendar day, count days below threshold
  const thresholdSeconds = zones.rest_day_threshold_minutes * 60
  const dayTotals = new Map<string, number>()
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  // Build day map for the range
  const cursor = new Date(start)
  while (cursor < end && cursor <= today) {
    dayTotals.set(toLocalDateKey(cursor), 0)
    cursor.setDate(cursor.getDate() + 1)
  }
  for (const a of rangeActivities ?? []) {
    const key = toLocalDateKey(new Date(a.start_date))
    if (dayTotals.has(key)) {
      dayTotals.set(key, (dayTotals.get(key) ?? 0) + effectiveContributionSeconds(a))
    }
  }
  const restDayCount = Array.from(dayTotals.values()).filter((v) =>
    zones.rest_day_threshold_minutes === 0 ? v === 0 : v < thresholdSeconds
  ).length

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Statistics</h1>
      </div>

      <TimeRangeSelector current={range} offset={offset} periodLabel={label} />

      <div className="space-y-6">
        {/* Volume chart */}
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Training Volume (hours)
              </h2>
              <VolumeBarChart data={volumeData} sports={sports} range={range} />
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-4xl font-bold text-gray-900 leading-none">{totalHoursLabel}</p>
              <p className="text-xs text-gray-400 mt-1">total</p>
            </div>
          </div>
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

        {/* Intensity breakdown + Rest days */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Intensity Breakdown
            </h2>
            <IntensityBreakdown activities={rangeActivities ?? []} />
          </div>
          <div className="border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Rest Days
            </h2>
            <RestDaysWidget
              restDayCount={restDayCount}
              thresholdMinutes={zones.rest_day_threshold_minutes}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
