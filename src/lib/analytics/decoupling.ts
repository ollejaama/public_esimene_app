import { computeSpeedKmh } from './speed'
import { SPORT_TYPE_MAP } from '@/lib/constants'

// Sports eligible for decoupling analysis (need valid outdoor GPS + HR)
const ELIGIBLE_SPORT_CATEGORIES = new Set(['Running', 'Cycling', 'Skiing'])

export function isEligibleForDecoupling(sportType: string, customSportTag: string | null, intensityType?: string | null): boolean {
  // Only steady aerobic efforts — intervals/speed/competition show artificial decoupling
  if (intensityType === 'interval' || intensityType === 'speed' || intensityType === 'competition') return false
  if (customSportTag === 'treadmill_skiing' || customSportTag === 'strength_basic') return false
  const category = SPORT_TYPE_MAP[sportType] ?? 'Other'
  return ELIGIBLE_SPORT_CATEGORIES.has(category)
}

/**
 * Aerobic decoupling (AeD): measures how much HR drifts relative to pace
 * from the first half to the second half of the activity.
 *
 * Formula: ((Pa:HR_first / Pa:HR_second) - 1) × 100%
 * where Pa:HR = avg_speed_kmh / avg_hr (higher = more efficient)
 *
 * Positive = HR rose faster than pace fell (cardiac drift → decoupling)
 */
export function computeDecoupling(
  hrData: number[],
  latlng: [number, number][],
  activitySeconds: number
): number | null {
  if (hrData.length < 20 || latlng.length < 20) return null

  const speedKmh = computeSpeedKmh(latlng, activitySeconds / latlng.length)

  // Use the shorter array as the common length to split by time
  const n = Math.min(hrData.length, speedKmh.length)
  const mid = Math.floor(n / 2)

  const hrFirst = hrData.slice(0, mid).filter(v => v > 0)
  const hrSecond = hrData.slice(mid, n).filter(v => v > 0)
  const speedFirst = speedKmh.slice(0, mid).filter(v => v > 0)
  const speedSecond = speedKmh.slice(mid, n).filter(v => v > 0)

  if (!hrFirst.length || !hrSecond.length || !speedFirst.length || !speedSecond.length) return null

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const paHrFirst = avg(speedFirst) / avg(hrFirst)
  const paHrSecond = avg(speedSecond) / avg(hrSecond)

  if (paHrSecond === 0) return null

  return Math.round(((paHrFirst / paHrSecond) - 1) * 1000) / 10  // one decimal
}
