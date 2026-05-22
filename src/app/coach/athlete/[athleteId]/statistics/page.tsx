import { AppShell } from '@/components/layout/AppShell'
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
import { coachCanViewAthlete } from '@/lib/coach'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

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

  return { start: new Date(2000, 0, 1), end: new Date(2099, 0, 1), label: 'All time' }
}

function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ZONE_KEYS = ['z0', 'z1', 'z2', 'z3', 'z4', 'z5'] as const
const ZONE_LABELS: Record<string, string> = { z0: 'I0', z1: 'I1', z2: 'I2', z3: 'I3', z4: 'I4', z5: 'I5' }
const ZONE_COLORS: Record<string, string> = {
  z0: '#6b8aa3', z1: '#9ab48a', z2: '#7a9c66', z3: '#c6a24a', z4: '#c8703a', z5: '#a23b2a',
}

export default async function CoachAthleteStatisticsPage({
  params,
  searchParams,
}: {
  params: { athleteId: string }
  searchParams: { range?: string; offset?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'coach') redirect('/activities')

  const { athleteId } = params
  const hasAccess = await coachCanViewAthlete(session.userId, athleteId)
  if (!hasAccess) redirect('/coach')

  const range = (searchParams.range ?? 'week') as TimeRange
  const offset = parseInt(searchParams.offset ?? '0')

  const { start, end, label } = getDateRange(range, offset)

  const db = createServiceClient()

  const startDateStr = start.toISOString().slice(0, 10)
  const endDateStr = end.toISOString().slice(0, 10)

  const [
    { data: athleteProfile },
    { data: rangeActivities },
    { data: zoneData },
    { data: userSettingsData },
    { data: illnessData },
  ] = await Promise.all([
    db.from('user_profiles').select('display_name').eq('id', athleteId).single(),
    db.from('activities')
      .select('*')
      .eq('user_id', athleteId)
      .eq('hidden', false)
      .gte('start_date', start.toISOString())
      .lt('start_date', end.toISOString())
      .order('start_date', { ascending: true }),
    db.from('hr_zone_settings').select('*').eq('user_id', athleteId).maybeSingle(),
    db.from('user_settings').select('*').eq('user_id', athleteId).maybeSingle(),
    db.from('illness_log').select('*').eq('user_id', athleteId)
      .lte('start_date', endDateStr)
      .gte('end_date', startDateStr),
  ])

  const athleteName = athleteProfile?.display_name ?? 'Athlete'
  const zones: HRZoneSettings = zoneData ?? DEFAULT_ZONES

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
        .eq('user_id', athleteId)
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

  const intervalActivityIds = (rangeActivities ?? []).filter((a) => a.intensity_type === 'interval').map((a) => a.id)
  const { data: intervalSetsRaw } = intervalActivityIds.length > 0
    ? await db.from('interval_sets').select('*').in('activity_id', intervalActivityIds).eq('user_id', athleteId)
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

  let prevSeasonHours: number | null = null
  if (range === 'season') {
    const seasonStartYear = start.getFullYear()
    const prevStart = new Date(seasonStartYear - 1, 4, 1)
    const { data: prevActivities } = await db
      .from('activities')
      .select('id, moving_time, elapsed_time, contribution_hours')
      .eq('user_id', athleteId)
      .eq('hidden', false)
      .gte('start_date', prevStart.toISOString())
      .lt('start_date', start.toISOString())
    if (prevActivities && prevActivities.length > 0) {
      prevSeasonHours = prevActivities.reduce((s, a) => s + effectiveContributionSeconds(a as any), 0) / 3600
    }
  }

  const seasonYear = range === 'season'
    ? `${start.getFullYear()}/${String(start.getFullYear() + 1).slice(-2)}`
    : null

  return (
    <AppShell viewingAthleteId={athleteId} viewingAthleteName={athleteName}>
      {/* Page head */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            Chapter IV · the season so far
          </p>
          <h1 className="font-serif text-[56px] tracking-[-0.03em] leading-[1.05] text-atlas-ink mt-1.5">
            Statistics{seasonYear && <span className="italic text-atlas-accent"> {seasonYear}</span>}
          </h1>
        </div>
        <TimeRangeSelector current={range} offset={offset} periodLabel={label} />
      </div>

      <div className="space-y-6">
        {/* Plate I — Training Volume */}
        <div className="bg-atlas-panel border border-atlas-rule" style={{ borderTop: '1.5px solid var(--atlas-ink)', padding: '20px 24px 24px' }}>
          <div className="flex items-start gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
                    Plate I · Training volume
                  </p>
                  <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
                    {range === 'season' ? 'weekly totals, stacked by zone' : 'stacked by zone'}
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap justify-end mt-0.5">
                  {ZONE_KEYS.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.1em] text-atlas-muted">
                      <span className="w-[9px] h-[9px] flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[k] }} />
                      {ZONE_LABELS[k]}
                    </span>
                  ))}
                </div>
              </div>
              <VolumeByZoneChart data={zoneProgressionData} zoneNames={zoneNames} range={range} />
            </div>

            <div className="text-right flex-shrink-0 pl-6 border-l border-atlas-rule" style={{ minWidth: 160 }}>
              <div className="font-serif text-[64px] tracking-[-0.03em] leading-[0.95] text-atlas-ink">
                {totalHoursLabel}
              </div>
              <p className="font-serif italic text-[15px] text-atlas-muted mt-2">
                total in {range}
              </p>
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-atlas-faint mt-2">
                {(rangeActivities ?? []).length} sessions
              </p>
            </div>
          </div>

          {range === 'month' && (
            <div className="mt-4 pt-4 border-t border-atlas-rule">
              <MonthlyVolumeWidget
                currentHours={totalSeconds / 3600}
                monthStart={start}
                monthEnd={end}
              />
            </div>
          )}
          {range === 'season' && (
            <div className="mt-4 pt-4 border-t border-atlas-rule">
              <SeasonalVolumeWidget
                currentHours={totalSeconds / 3600}
                seasonStart={start}
                seasonEnd={end}
                prevSeasonHours={prevSeasonHours}
              />
            </div>
          )}
        </div>

        {/* Plates II + III */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-atlas-panel border border-atlas-rule" style={{ borderTop: '1.5px solid var(--atlas-ink)', padding: '18px 22px 22px' }}>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Plate II · Sport breakdown</p>
            <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5 mb-4">where the hours went</p>
            <SportBreakdownTable bySport={summary.bySport} />
          </div>

          <div className="bg-atlas-panel border border-atlas-rule" style={{ borderTop: '1.5px solid var(--atlas-ink)', padding: '18px 22px 22px' }}>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Plate III · Heart-rate distribution</p>
            <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5 mb-4">where the heart has lived</p>
            <HRZoneDonutChart zones={zoneRows} />
          </div>
        </div>

        {/* Plates IV + V + VI */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="bg-atlas-panel border border-atlas-rule" style={{ borderTop: '1.5px solid var(--atlas-ink)', padding: '18px 22px 22px' }}>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Plate IV · Intensity breakdown</p>
            <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5 mb-5">tap a category to read the entries</p>
            <IntensityBreakdown activities={rangeActivities ?? []} intervalZoneSummary={intervalZoneSummary} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-atlas-panel border border-atlas-rule flex-1" style={{ borderTop: '1.5px solid var(--atlas-ink)', padding: '16px 20px 18px' }}>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-2.5">Plate V · Rest days</p>
              <RestDaysWidget
                restDayCount={restDayCount}
                thresholdMinutes={zones.rest_day_threshold_minutes}
                restDayDates={restDayDates}
              />
            </div>
            <div className="bg-atlas-panel border border-atlas-rule flex-1" style={{ borderTop: '1.5px solid var(--atlas-ink)', padding: '16px 20px 18px' }}>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-2.5">Plate VI · Health</p>
              <IllnessWidget
                illnessEntries={illnessData ?? []}
                start={start}
                end={end}
              />
            </div>
          </div>
        </div>

        {/* Plate VII — Effort rating */}
        {userSettingsData?.show_rpe && (
          <div className="bg-atlas-panel border border-atlas-rule" style={{ borderTop: '1.5px solid var(--atlas-ink)', padding: '18px 22px 22px' }}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Plate VII · Effort rating</p>
                <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">perceived effort, by the athlete's own hand</p>
              </div>
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-atlas-faint">
                {userSettingsData.rpe_scale === 'borg' ? 'Borg (6–20)' : 'RPE (1–10)'}
              </span>
            </div>
            <RPEWidget
              activities={rangeActivities ?? []}
              scale={(userSettingsData.rpe_scale as 'rpe' | 'borg') ?? 'rpe'}
            />
          </div>
        )}

        {/* Plate VIII — Lactate */}
        {range === 'season' && userSettingsData?.show_lactate && (
          <div className="bg-atlas-panel border border-atlas-rule" style={{ borderTop: '1.5px solid var(--atlas-ink)', padding: '18px 22px 22px' }}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Plate VIII · Lactate</p>
                <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">measured in millimoles, recorded by hand</p>
              </div>
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-atlas-faint">mmol/L</span>
            </div>
            <LactateChart avg={lactateAvg} sessionCount={lactateSessionCount} lactateBySport={lactateBySport} />
          </div>
        )}

        {/* Marginalia footer */}
        <div className="border-t border-atlas-rule pt-3 flex items-baseline justify-between mt-2">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted">Marginalia</span>
          <span className="font-serif italic text-[14px] text-atlas-muted">
            {(rangeActivities ?? []).length} entries ·{' '}
            <span className="text-atlas-accent">season in progress</span>
          </span>
        </div>
      </div>
    </AppShell>
  )
}
