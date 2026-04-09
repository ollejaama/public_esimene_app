import { Activity, ActivityHRStream, HRZoneSettings } from '@/lib/supabase/types'
import { SPORT_TYPE_MAP, SPORT_COLORS } from '@/lib/constants'
import { computeHRZoneSeconds, aggregateZoneSeconds, ZoneSeconds } from './hrZones'

export interface WeekSummary {
  totalSeconds: number
  totalSessions: number
  bySport: SportTotal[]
  zoneSeconds: ZoneSeconds
}

export interface SportTotal {
  key: string
  label: string
  color: string
  seconds: number
  sessions: number
}

function getSportKey(activity: Activity): string {
  if (activity.custom_sport_tag) return activity.custom_sport_tag
  return SPORT_TYPE_MAP[activity.sport_type] ?? 'Other'
}

export function aggregateWeek(
  activities: Activity[],
  streams: ActivityHRStream[],
  zones: HRZoneSettings
): WeekSummary {
  const streamMap = new Map(streams.map((s) => [s.activity_id, s.hr_data]))

  const sportMap = new Map<string, SportTotal>()
  const allZoneSeconds: ZoneSeconds[] = []

  for (const activity of activities) {
    const key = getSportKey(activity)
    const existing = sportMap.get(key)
    const color = SPORT_COLORS[key] ?? SPORT_COLORS.Other

    if (existing) {
      existing.seconds += activity.elapsed_time
      existing.sessions += 1
    } else {
      sportMap.set(key, {
        key,
        label: key,
        color,
        seconds: activity.elapsed_time,
        sessions: 1,
      })
    }

    const hrData = streamMap.get(activity.id)
    if (hrData) {
      allZoneSeconds.push(computeHRZoneSeconds(hrData, zones))
    }
  }

  return {
    totalSeconds: activities.reduce((sum, a) => sum + a.elapsed_time, 0),
    totalSessions: activities.length,
    bySport: Array.from(sportMap.values()),
    zoneSeconds: aggregateZoneSeconds(allZoneSeconds),
  }
}

// Get ISO week number and year
export function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1
  return { week, year: d.getFullYear() }
}

// Get Monday of a given ISO week
export function getWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const jan4Day = (jan4.getDay() + 6) % 7  // 0=Mon
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - jan4Day + (week - 1) * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 7)
  return end
}
