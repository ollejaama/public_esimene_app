import { Activity } from '@/lib/supabase/types'
import { SPORT_TYPE_MAP, SPORT_COLORS } from '@/lib/constants'
import { getISOWeek } from './weekSummary'

export interface WeeklyVolumeBar {
  weekLabel: string  // "W10 2026"
  weekStart: string  // ISO date
  [sport: string]: number | string  // sport key → hours (number)
}

// Groups activities by ISO week, returns Recharts-compatible array
export function groupByWeek(activities: Activity[], sports?: string[]): WeeklyVolumeBar[] {
  const weekMap = new Map<string, WeeklyVolumeBar>()

  for (const activity of activities) {
    const date = new Date(activity.start_date)
    const { week, year } = getISOWeek(date)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    const weekLabel = `W${week} ${year}`

    if (!weekMap.has(key)) {
      weekMap.set(key, { weekLabel, weekStart: key })
    }

    const bar = weekMap.get(key)!
    const sportKey = activity.custom_sport_tag
      ? activity.custom_sport_tag
      : (SPORT_TYPE_MAP[activity.sport_type] ?? 'Other')

    if (!sports || sports.includes(sportKey)) {
      const hours = (activity.moving_time ?? activity.elapsed_time) / 3600
      bar[sportKey] = ((bar[sportKey] as number) ?? 0) + hours
    }
  }

  // Sort by week
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

export function getAllSportsFromActivities(activities: Activity[]): string[] {
  const set = new Set<string>()
  for (const a of activities) {
    const key = a.custom_sport_tag ?? (SPORT_TYPE_MAP[a.sport_type] ?? 'Other')
    set.add(key)
  }
  return Array.from(set)
}

export function getSportColor(sport: string): string {
  return SPORT_COLORS[sport] ?? SPORT_COLORS.Other
}
