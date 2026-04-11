import { HRZoneSettings, ActivityHRStream } from '@/lib/supabase/types'
import { HR_ZONE_COLORS } from '@/lib/constants'

export interface ZoneSeconds {
  z0: number
  z1: number
  z2: number
  z3: number
  z4: number
  z5: number
}

export interface ZoneRow {
  name: string
  color: string
  seconds: number
  percent: number
}

// Classify every sample in the HR stream into a zone.
// Zone 0 (I0) is fixed: 0–99 bpm (non-editable).
// If activitySeconds is provided the zone totals are scaled proportionally so
// they sum exactly to activitySeconds, correcting for streams sampled at less
// than 1 sample/second (Strava medium/low resolution).
export function computeHRZoneSeconds(
  hrData: number[],
  zones: HRZoneSettings,
  activitySeconds?: number
): ZoneSeconds {
  const counts: ZoneSeconds = { z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  for (const bpm of hrData) {
    if (bpm <= 0) { counts.z0++; continue }
    if (bpm <= 99) counts.z0++
    else if (bpm <= zones.zone1_max) counts.z1++
    else if (bpm <= zones.zone2_max) counts.z2++
    else if (bpm <= zones.zone3_max) counts.z3++
    else if (bpm <= zones.zone4_max) counts.z4++
    else counts.z5++
  }

  if (activitySeconds !== undefined && hrData.length > 0) {
    const scale = activitySeconds / hrData.length
    const scaled: ZoneSeconds = {
      z0: Math.round(counts.z0 * scale),
      z1: Math.round(counts.z1 * scale),
      z2: Math.round(counts.z2 * scale),
      z3: Math.round(counts.z3 * scale),
      z4: Math.round(counts.z4 * scale),
      z5: Math.round(counts.z5 * scale),
    }
    // Absorb rounding error into z0 so total == activitySeconds exactly
    const total = scaled.z0 + scaled.z1 + scaled.z2 + scaled.z3 + scaled.z4 + scaled.z5
    scaled.z0 += activitySeconds - total
    return scaled
  }

  return counts
}

export function aggregateZoneSeconds(streams: ZoneSeconds[]): ZoneSeconds {
  return streams.reduce(
    (acc, s) => ({
      z0: acc.z0 + s.z0,
      z1: acc.z1 + s.z1,
      z2: acc.z2 + s.z2,
      z3: acc.z3 + s.z3,
      z4: acc.z4 + s.z4,
      z5: acc.z5 + s.z5,
    }),
    { z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  )
}

export function zoneSecondsToRows(totals: ZoneSeconds, zones: HRZoneSettings): ZoneRow[] {
  const total = totals.z0 + totals.z1 + totals.z2 + totals.z3 + totals.z4 + totals.z5

  const zone0Row: ZoneRow = {
    name: 'I0',
    color: '#94a3b8',
    seconds: totals.z0,
    percent: total > 0 ? Math.round((totals.z0 / total) * 100) : 0,
  }

  const names = [zones.zone1_name, zones.zone2_name, zones.zone3_name, zones.zone4_name, zones.zone5_name]
  const values = [totals.z1, totals.z2, totals.z3, totals.z4, totals.z5]

  return [
    zone0Row,
    ...names.map((name, i) => ({
      name,
      color: HR_ZONE_COLORS[i],
      seconds: values[i],
      percent: total > 0 ? Math.round((values[i] / total) * 100) : 0,
    })),
  ]
}

// Returns total seconds with valid HR data (bpm > 0)
export function totalHRSeconds(totals: ZoneSeconds): number {
  return totals.z0 + totals.z1 + totals.z2 + totals.z3 + totals.z4 + totals.z5
}

// Format seconds as h:mm
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

// Format seconds as h:mm:ss (for HR zone tables)
export function formatDurationFull(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
