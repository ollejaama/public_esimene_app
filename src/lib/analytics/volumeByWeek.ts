import { Activity } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { getISOWeek } from './weekSummary'
import { effectiveSportKey, effectiveContributionSeconds } from '@/lib/activity'

export interface WeeklyVolumeBar {
  label: string      // Display label for X axis
  periodKey: string  // Sort key (ISO date or year-week string)
  [sport: string]: number | string
}

// Groups activities by ISO week, returns Recharts-compatible array (no zero-fill)
export function groupByWeek(activities: Activity[], sports?: string[]): WeeklyVolumeBar[] {
  const weekMap = new Map<string, WeeklyVolumeBar>()

  for (const activity of activities) {
    const date = new Date(activity.start_date)
    const { week, year } = getISOWeek(date)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    const weekLabel = `W${week} ${year}`

    if (!weekMap.has(key)) {
      weekMap.set(key, { label: weekLabel, periodKey: key })
    }

    const bar = weekMap.get(key)!
    const sportKey = effectiveSportKey(activity)

    if (!sports || sports.includes(sportKey)) {
      const hours = effectiveContributionSeconds(activity) / 3600
      bar[sportKey] = ((bar[sportKey] as number) ?? 0) + hours
    }
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * One bar per calendar day in [rangeStart, rangeEnd).
 * labelFormat 'weekday' → "Mon"…"Sun", 'daynum' → "1"…"31"
 * Zero-fills days with no training.
 */
// Use local calendar date to avoid UTC-offset mismatches
function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function groupByDay(
  activities: Activity[],
  rangeStart: Date,
  rangeEnd: Date,
  labelFormat: 'weekday' | 'daynum',
  sports?: string[]
): WeeklyVolumeBar[] {
  // Build empty bars for every day in range
  const bars = new Map<string, WeeklyVolumeBar>()
  const cursor = new Date(rangeStart)
  while (cursor < rangeEnd) {
    const key = toLocalDateKey(cursor)
    const dow = (cursor.getDay() + 6) % 7 // 0=Mon … 6=Sun
    const label = labelFormat === 'weekday' ? WEEKDAY_LABELS[dow] : String(cursor.getDate())
    bars.set(key, { label, periodKey: key })
    cursor.setDate(cursor.getDate() + 1)
  }

  for (const activity of activities) {
    const key = toLocalDateKey(new Date(activity.start_date))
    if (!bars.has(key)) continue

    const bar = bars.get(key)!
    const sportKey = effectiveSportKey(activity)

    if (!sports || sports.includes(sportKey)) {
      const hours = effectiveContributionSeconds(activity) / 3600
      bar[sportKey] = ((bar[sportKey] as number) ?? 0) + hours
    }
  }

  return Array.from(bars.values())
}

/**
 * One bar per month (Jan–Dec) for the given year. Zero-fills months with no training.
 */
export function groupByMonth(
  activities: Activity[],
  year: number,
  sports?: string[]
): WeeklyVolumeBar[] {
  const bars: WeeklyVolumeBar[] = MONTH_LABELS.map((label, i) => ({
    label,
    periodKey: `${year}-${String(i + 1).padStart(2, '0')}`,
  }))

  for (const activity of activities) {
    const date = new Date(activity.start_date)
    if (date.getFullYear() !== year) continue
    const monthIdx = date.getMonth() // 0-based

    const bar = bars[monthIdx]
    const sportKey = effectiveSportKey(activity)

    if (!sports || sports.includes(sportKey)) {
      const hours = effectiveContributionSeconds(activity) / 3600
      bar[sportKey] = ((bar[sportKey] as number) ?? 0) + hours
    }
  }

  return bars
}

export function getAllSportsFromActivities(activities: Activity[]): string[] {
  const set = new Set<string>()
  for (const a of activities) {
    set.add(effectiveSportKey(a))
  }
  return Array.from(set)
}

export function getSportColor(sport: string): string {
  const colorKey = CUSTOM_TAG_COLOR_KEY[sport] ?? sport
  return SPORT_COLORS[colorKey] ?? SPORT_COLORS.Other
}
