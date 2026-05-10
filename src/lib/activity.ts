import { Activity } from '@/lib/supabase/types'
import { SPORT_TYPE_MAP, CUSTOM_SPORT_TAG_LABELS, CustomSportTag } from '@/lib/constants'

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
