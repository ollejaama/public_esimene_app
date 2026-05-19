import { AppShell } from '@/components/layout/AppShell'
import { SyncRefresher } from '@/components/sync/SyncRefresher'
import { TimeRangeSelector, TimeRange } from '@/components/statistics/TimeRangeSelector'
import { VolumeByZoneChart } from '@/components/statistics/VolumeByZoneChart'
import { SeasonalVolumeWidget } from '@/components/statistics/SeasonalVolumeWidget'
import { MonthlyVolumeWidget } from '@/components/statistics/MonthlyVolumeWidget'
import { HRZoneDonutChart } from '@/components/statistics/HRZoneDonutChart'
import { SportBreakdownTable } from '@/components/statistics/SportBreakdownTable'
import { IntensityBreakdown } from '@/components/statistics/IntensityBreakdown'
import { RestDaysWidget } from '@/components/statistics/RestDaysWidget'
import { RPEWidget } from '@/components/statistics/RPEWidget'
import { IllnessWidget } from '@/components/statistics/IllnessWidget'
import { LactateChart } from '@/components/statistics/LactateChart'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { HRZoneSettings } from '@/lib/supabase/types'
import { aggregateWeek } from '@/lib/analytics/weekSummary'
import { zoneSecondsToRows, computeHRZoneSeconds } from '@/lib/analytics/hrZones'
import { computeZoneProgression } from '@/lib/analytics/zoneProgression'
import { effectiveContributionSeconds, effectiveSportKey } from '@/lib/activity'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Statistics — Training Analytics' }

const DEFAULT_ZONES: HRZoneSettings = {
  id: '', user_id: '', updated_at: '',
  zone1_max: 130, zone2_max: 148, zone3_max: 162, zone4_max: 174,
  zone1_name: 'I1', zone2_name: 'I2', zone3_name: 'I3', zone4_name: 'I4', zone5_name: 'I5',
  rest_day_threshold_minutes: 0,
}

function getSeasonStartYear(now: Date): number {
  return now.getMonth() >= 4 ? now.getFullYear() : now.getFullYear() - 1
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
      start: d, end,
      label: d.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    }
  }

  if (range === 'season') {
    const seasonStartYear = getSeasonStartYear(now) + offset
    const start = new Date(seasonStartYear, 4, 1)
    const end = new Date(seasonStartYear + 1, 4, 1)
    const y1 = String(seasonStartYear).slice(-2)
    const y2 = String(seasonStartYear + 1).slice(-2)
    return { start, end, label: `Season ${y1}/${y2}` }
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

  const startDateStr = start.toISOString().slice(0, 10)
  const endDateStr = end.toISOString().slice(0, 10)

  const [{ data: rangeActivities }, { data: zoneData }, { data: userSettingsData }, { data: illnessData }] = await Promise.all([
    db.from('activities')
      .select('*')
      .eq('user_id', session.userId)
      .eq('hidden', false)
      .gte('start_date', start.toISOString())
      .lt('start_date', end.toISOString())
      .order('start_date', { ascending: true }),
    db.from('hr_zone_settings').select('*').eq('user_id', session.userId).maybeSingle(),
    db.from('user_settings').select('*').eq('user_id', session.userId).maybeSingle(),
    db.from('illness_log').select('*').eq('user_id', session.userId)
      .lte('start_date', endDateStr)
      .gte('end_date', startDateStr),
  ])

  const zones: HRZoneSettings = zoneData ?? DEFAULT_ZONES

  // HR streams for the selected range
  const hrActivityIds = (rangeActivities ?? []).filter((a) => a.has_hr_data).map((a) => a.id)
  const { data: streams } = hrActivityIds.length > 0
    ? await db.from('activity_hr_streams').select('*').in('activity_id', hrActivityIds)
    : { data: [] }

  const streamMap = new Map((streams ?? []).map((s) => [s.activity_id, s.hr_data as number[]]))

  const summary = aggregateWeek(rangeActivities ?? [], streams ?? [], zones)
  const zoneRows = zoneSecondsToRows(summary.zoneSeconds, zones)

  const zoneProgressionData = computeZoneProgression(rangeActivities ?? [], streamMap, zones, range, start, end)

  const zoneNames: Record<string, string> = {
    z0: 'I0',
    z1: zones.zone1_name,
    z2: zones.zone2_name,
    z3: zones.zone3_name,
    z4: zones.zone4_name,
    z5: zones.zone5_name,
  }

  const totalSeconds = (rangeActivities ?? []).reduce(
    (sum, a) => sum + effectiveContributionSeconds(a), 0
  )
  const totalH = Math.floor(totalSeconds / 3600)
  const totalM = Math.round((totalSeconds % 3600) / 60)
  const totalHoursLabel = totalM > 0 ? `${totalH}h ${totalM}m` : `${totalH}h`

  // Compute rest days
  const thresholdSeconds = zones.rest_day_threshold_minutes * 60
  const dayTotals = new Map<string, number>()
  const today = new Date()
  today.setHours(23, 59, 59, 999)

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

  const restDayDates = Array.from(dayTotals.entries())
    .filter(([, v]) => zones.rest_day_threshold_minutes === 0 ? v === 0 : v < thresholdSeconds)
    .map(([key]) => key)

  // Lactate: average of per-activity averages + per-sport averages (season view only)
  let lactateAvg: number | null = null
  let lactateSessionCount = 0
  let lactateBySport: { sportKey: string; avgMmol: number }[] = []
  if (range === 'season' && userSettingsData?.show_lactate) {
    const activityIds = (rangeActivities ?? []).map((a) => a.id)
    if (activityIds.length > 0) {
      const { data: lactateRows } = await db
        .from('lactate_measurements')
        .select('value_mmol, activity_id')
        .in('activity_id', activityIds)
        .eq('user_id', session.userId)
      if (lactateRows && lactateRows.length > 0) {
        const byActivity = new Map<string, number[]>()
        const sportLactate = new Map<string, { sum: number; count: number }>()
        for (const row of lactateRows) {
          const arr = byActivity.get(row.activity_id) ?? []
          arr.push(row.value_mmol)
          byActivity.set(row.activity_id, arr)
          const matchedActivity = (rangeActivities ?? []).find((a) => a.id === row.activity_id)
          if (matchedActivity) {
            const sportKey = effectiveSportKey(matchedActivity)
            const entry = sportLactate.get(sportKey) ?? { sum: 0, count: 0 }
            sportLactate.set(sportKey, { sum: entry.sum + row.value_mmol, count: entry.count + 1 })
          }
        }
        const activityAvgs = Array.from(byActivity.values()).map((vals) => vals.reduce((s, v) => s + v, 0) / vals.length)
        lactateAvg = activityAvgs.reduce((s, v) => s + v, 0) / activityAvgs.length
        lactateSessionCount = byActivity.size
        lactateBySport = Array.from(sportLactate.entries())
          .map(([sportKey, { sum, count }]) => ({ sportKey, avgMmol: sum / count }))
      }
    }
  }

  // Interval sets: fetch for interval activities to compute booked vs actual zone summary
  const intervalActivityIds = (rangeActivities ?? []).filter((a) => a.intensity_type === 'interval').map((a) => a.id)
  const { data: intervalSetsRaw } = intervalActivityIds.length > 0
    ? await db.from('interval_sets').select('*').in('activity_id', intervalActivityIds).eq('user_id', session.userId)
    : { data: [] as Array<{ activity_id: string; reps: number; duration_secs: number; zone: string }> }

  const bookedZones: Record<string, number> = { I2: 0, I3: 0, I4: 0, I5: 0 }
  for (const s of intervalSetsRaw ?? []) {
    const total = s.reps * s.duration_secs
    if (s.zone === 'Progressive') {
      bookedZones.I2 += total / 4; bookedZones.I3 += total / 4
      bookedZones.I4 += total / 4; bookedZones.I5 += total / 4
    } else {
      bookedZones[s.zone] = (bookedZones[s.zone] ?? 0) + total
    }
  }

  // Actual zone seconds for interval activities from HR streams
  const actualZones: Record<string, number> = { I2: 0, I3: 0, I4: 0, I5: 0 }
  for (const actId of intervalActivityIds) {
    const hrStream = streamMap.get(actId)
    if (!hrStream) continue
    const act = (rangeActivities ?? []).find((a) => a.id === actId)
    if (!act) continue
    const actSecs = act.moving_time ?? act.elapsed_time
    const zs = computeHRZoneSeconds(hrStream, zones, actSecs)
    actualZones.I2 += zs.z2
    actualZones.I3 += zs.z3
    actualZones.I4 += zs.z4
    actualZones.I5 += zs.z5
  }

  const intervalZoneSummary = (['I2', 'I3', 'I4', 'I5'] as const)
    .filter((z) => bookedZones[z] > 0 || actualZones[z] > 0)
    .map((zone) => ({ zone, bookedSecs: bookedZones[zone], actualSecs: actualZones[zone] }))

  // Season-only: previous season total for comparison
  let prevSeasonHours: number | null = null
  if (range === 'season') {
    const seasonStartYear = start.getFullYear()
    const prevStart = new Date(seasonStartYear - 1, 4, 1)
    const { data: prevActivities } = await db
      .from('activities')
      .select('id, moving_time, elapsed_time, contribution_hours')
      .eq('user_id', session.userId)
      .eq('hidden', false)
      .gte('start_date', prevStart.toISOString())
      .lt('start_date', start.toISOString())
    if (prevActivities && prevActivities.length > 0) {
      prevSeasonHours = prevActivities.reduce((s, a) => s + effectiveContributionSeconds(a as any), 0) / 3600
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Statistics</h1>
      </div>

      <SyncRefresher />
      <TimeRangeSelector current={range} offset={offset} periodLabel={label} />

      <div className="space-y-6">
        {/* Zone progression chart */}
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Training Volume
              </h2>
              <VolumeByZoneChart data={zoneProgressionData} zoneNames={zoneNames} range={range} />
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-4xl font-bold text-gray-900 leading-none">{totalHoursLabel}</p>
              <p className="text-xs text-gray-400 mt-1">total</p>
            </div>
          </div>
        </div>

        {/* Monthly volume projection — month view only */}
        {range === 'month' && (
          <div className="border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Month Volume
            </h2>
            <MonthlyVolumeWidget
              currentHours={totalSeconds / 3600}
              monthStart={start}
              monthEnd={end}
            />
          </div>
        )}

        {/* Seasonal volume estimate — season view only */}
        {range === 'season' && (
          <div className="border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Season Volume
            </h2>
            <SeasonalVolumeWidget
              currentHours={totalSeconds / 3600}
              seasonStart={start}
              seasonEnd={end}
              prevSeasonHours={prevSeasonHours}
            />
          </div>
        )}

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

        {/* Intensity breakdown + Rest days + Illness */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Intensity Breakdown
            </h2>
            <IntensityBreakdown activities={rangeActivities ?? []} intervalZoneSummary={intervalZoneSummary} />
          </div>
          <div className="space-y-4">
            <div className="border border-[#e5e5e5] rounded-lg p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Rest Days
              </h2>
              <RestDaysWidget
                restDayCount={restDayCount}
                thresholdMinutes={zones.rest_day_threshold_minutes}
                restDayDates={restDayDates}
              />
            </div>
            <div className="border border-[#e5e5e5] rounded-lg p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Health
              </h2>
              <IllnessWidget
                illnessEntries={illnessData ?? []}
                start={start}
                end={end}
              />
            </div>
          </div>
        </div>

        {/* RPE — when enabled */}
        {userSettingsData?.show_rpe && (
          <div className="border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Effort Rating
            </h2>
            <RPEWidget
              activities={rangeActivities ?? []}
              scale={(userSettingsData.rpe_scale as 'rpe' | 'borg') ?? 'rpe'}
            />
          </div>
        )}

        {/* Lactate — season view only, when enabled */}
        {range === 'season' && userSettingsData?.show_lactate && (
          <div className="border border-[#e5e5e5] rounded-lg p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Lactate
            </h2>
            <LactateChart avg={lactateAvg} sessionCount={lactateSessionCount} lactateBySport={lactateBySport} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
