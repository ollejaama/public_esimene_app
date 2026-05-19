import { Activity, HRZoneSettings } from '@/lib/supabase/types'
import { computeHRZoneSeconds, ZoneSeconds } from '@/lib/analytics/hrZones'
import { applyPartialContribution, effectiveContributionSeconds, effectiveDuration } from '@/lib/activity'
import { getISOWeek } from '@/lib/analytics/weekSummary'

type TimeRange = 'week' | 'month' | 'season' | 'all'

export interface ZoneProgressionPoint {
  label: string
  periodKey: string
  z0: number | null
  z1: number | null
  z2: number | null
  z3: number | null
  z4: number | null
  z5: number | null
  totalHours: number
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SEASON_MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3] // May–Apr (0-based JS months)

function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function computeActivityZones(
  activity: Activity,
  streamMap: Map<string, number[]>,
  zones: HRZoneSettings,
): ZoneSeconds {
  const contributionSecs = effectiveContributionSeconds(activity)
  if (activity.has_hr_data) {
    const hrData = streamMap.get(activity.id)
    if (hrData && hrData.length > 0) {
      const rawZones = computeHRZoneSeconds(hrData, zones, effectiveDuration(activity))
      return applyPartialContribution(rawZones, contributionSecs)
    }
  }
  if (activity.is_manual && activity.manual_zone_seconds) {
    return applyPartialContribution(activity.manual_zone_seconds, contributionSecs)
  }
  return { z0: contributionSecs, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
}

function zonesToPoint(
  label: string,
  periodKey: string,
  zs: ZoneSeconds,
  totalSecs: number,
): ZoneProgressionPoint {
  if (totalSecs === 0) {
    return { label, periodKey, z0: null, z1: null, z2: null, z3: null, z4: null, z5: null, totalHours: 0 }
  }
  function pct(s: number): number | null {
    const p = (s / totalSecs) * 100
    return p === 0 ? null : Math.round(p * 10) / 10
  }
  return {
    label, periodKey,
    z0: pct(zs.z0), z1: pct(zs.z1), z2: pct(zs.z2),
    z3: pct(zs.z3), z4: pct(zs.z4), z5: pct(zs.z5),
    totalHours: Math.round((totalSecs / 3600) * 10) / 10,
  }
}

export function computeZoneProgression(
  activities: Activity[],
  streamMap: Map<string, number[]>,
  zones: HRZoneSettings,
  range: TimeRange,
  start: Date,
  end: Date,
): ZoneProgressionPoint[] {
  type Accumulator = { zs: ZoneSeconds; totalSecs: number }
  const buckets = new Map<string, Accumulator>()
  const keyToLabel = new Map<string, string>()
  const orderedKeys: string[] = []

  if (range === 'week' || range === 'month') {
    const cursor = new Date(start)
    while (cursor < end) {
      const key = toLocalDateKey(cursor)
      const dow = (cursor.getDay() + 6) % 7
      const label = range === 'week' ? WEEKDAY_LABELS[dow] : String(cursor.getDate())
      orderedKeys.push(key)
      keyToLabel.set(key, label)
      buckets.set(key, { zs: { z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }, totalSecs: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    for (const activity of activities) {
      const key = toLocalDateKey(new Date(activity.start_date))
      const bucket = buckets.get(key)
      if (!bucket) continue
      const az = computeActivityZones(activity, streamMap, zones)
      const contrib = effectiveContributionSeconds(activity)
      bucket.zs.z0 += az.z0; bucket.zs.z1 += az.z1; bucket.zs.z2 += az.z2
      bucket.zs.z3 += az.z3; bucket.zs.z4 += az.z4; bucket.zs.z5 += az.z5
      bucket.totalSecs += contrib
    }

  } else if (range === 'season') {
    const seasonStartYear = start.getFullYear()
    for (const jsMonth of SEASON_MONTH_ORDER) {
      const year = jsMonth >= 4 ? seasonStartYear : seasonStartYear + 1
      const key = toMonthKey(year, jsMonth)
      orderedKeys.push(key)
      keyToLabel.set(key, MONTH_LABELS[jsMonth])
      buckets.set(key, { zs: { z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }, totalSecs: 0 })
    }

    for (const activity of activities) {
      const d = new Date(activity.start_date)
      const key = toMonthKey(d.getFullYear(), d.getMonth())
      const bucket = buckets.get(key)
      if (!bucket) continue
      const az = computeActivityZones(activity, streamMap, zones)
      const contrib = effectiveContributionSeconds(activity)
      bucket.zs.z0 += az.z0; bucket.zs.z1 += az.z1; bucket.zs.z2 += az.z2
      bucket.zs.z3 += az.z3; bucket.zs.z4 += az.z4; bucket.zs.z5 += az.z5
      bucket.totalSecs += contrib
    }

  } else {
    // 'all': group by ISO week, no zero-fill
    for (const activity of activities) {
      const d = new Date(activity.start_date)
      const { week, year } = getISOWeek(d)
      const key = `${year}-W${String(week).padStart(2, '0')}`
      const label = `W${week}`
      if (!buckets.has(key)) {
        orderedKeys.push(key)
        keyToLabel.set(key, label)
        buckets.set(key, { zs: { z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }, totalSecs: 0 })
      }
      const bucket = buckets.get(key)!
      const az = computeActivityZones(activity, streamMap, zones)
      const contrib = effectiveContributionSeconds(activity)
      bucket.zs.z0 += az.z0; bucket.zs.z1 += az.z1; bucket.zs.z2 += az.z2
      bucket.zs.z3 += az.z3; bucket.zs.z4 += az.z4; bucket.zs.z5 += az.z5
      bucket.totalSecs += contrib
    }
    orderedKeys.sort()
  }

  return orderedKeys.map((key) => {
    const b = buckets.get(key)!
    return zonesToPoint(keyToLabel.get(key)!, key, b.zs, b.totalSecs)
  })
}
