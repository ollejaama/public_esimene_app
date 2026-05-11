import { Activity } from '@/lib/supabase/types'
import { SPORT_TYPE_MAP, CUSTOM_SPORT_TAG_LABELS, CustomSportTag } from '@/lib/constants'
import type { ZoneSeconds } from '@/lib/analytics/hrZones'

function getSportLabel(activity: Activity): string {
  if (activity.overridden_sport_type) {
    return CUSTOM_SPORT_TAG_LABELS[activity.overridden_sport_type as CustomSportTag] ?? activity.overridden_sport_type
  }
  if (activity.custom_sport_tag) {
    return CUSTOM_SPORT_TAG_LABELS[activity.custom_sport_tag as CustomSportTag] ?? activity.custom_sport_tag
  }
  return SPORT_TYPE_MAP[activity.sport_type] ?? activity.sport_type
}

export function getActivityTitle(activity: Activity): string {
  const hour = new Date(activity.start_date).getHours()
  const timeOfDay = hour < 12 ? 'Morning' : 'Evening'
  return `${timeOfDay} ${getSportLabel(activity)}`
}

export function effectiveDuration(activity: Activity): number {
  return activity.overridden_duration ?? activity.moving_time ?? activity.elapsed_time
}

export function effectiveSportKey(activity: Activity): string {
  if (activity.overridden_sport_type) return activity.overridden_sport_type
  if (activity.custom_sport_tag) return activity.custom_sport_tag
  return SPORT_TYPE_MAP[activity.sport_type] ?? 'Other'
}

export function effectiveContributionSeconds(activity: Activity): number {
  if (activity.contribution_hours != null) {
    return Math.round(activity.contribution_hours * 3600)
  }
  return effectiveDuration(activity)
}

// Trims zone seconds to a target total, keeping highest-intensity zones first.
// Example: 6h Z0 + 4h Z1, trimmed to 5h → 4h Z1 + 1h Z0
export function applyPartialContribution(zoneSeconds: ZoneSeconds, targetSeconds: number): ZoneSeconds {
  const order: (keyof ZoneSeconds)[] = ['z5', 'z4', 'z3', 'z2', 'z1', 'z0']
  const result: ZoneSeconds = { z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  let remaining = targetSeconds
  for (const key of order) {
    if (remaining <= 0) break
    const take = Math.min(zoneSeconds[key], remaining)
    result[key] = take
    remaining -= take
  }
  return result
}
