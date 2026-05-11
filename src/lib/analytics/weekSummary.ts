import { Activity, ActivityHRStream, HRZoneSettings } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { computeHRZoneSeconds, aggregateZoneSeconds, ZoneSeconds } from './hrZones'
import { effectiveDuration, effectiveSportKey, effectiveContributionSeconds, applyPartialContribution } from '@/lib/activity'

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
  return effectiveSportKey(activity)
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
    const color = SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
    const contributionSecs = effectiveContributionSeconds(activity)

    if (existing) {
      existing.seconds += contributionSecs
      existing.sessions += 1
    } else {
      sportMap.set(key, {
        key,
        label: key,
        color,
        seconds: contributionSecs,
        sessions: 1,
      })
    }

    const hrData = streamMap.get(activity.id)
    const activitySeconds = effectiveDuration(activity)
    if (hrData) {
      const rawZones = computeHRZoneSeconds(hrData, zones, activitySeconds)
      allZoneSeconds.push(applyPartialContribution(rawZones, contributionSecs))
    } else {
      // Activities without HR data count as I0 (untracked), scaled to contribution
      allZoneSeconds.push({ z0: contributionSecs, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 })
    }
  }

  return {
    totalSeconds: activities.reduce((sum, a) => sum + effectiveContributionSeconds(a), 0),
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
