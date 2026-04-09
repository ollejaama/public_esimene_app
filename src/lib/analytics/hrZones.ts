import { HRZoneSettings, ActivityHRStream } from '@/lib/supabase/types'
import { HR_ZONE_COLORS } from '@/lib/constants'

export interface ZoneSeconds {
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

// Classify every second in the HR stream into a zone.
export function computeHRZoneSeconds(hrData: number[], zones: HRZoneSettings): ZoneSeconds {
  const result: ZoneSeconds = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  for (const bpm of hrData) {
    if (bpm <= 0) continue
    if (bpm <= zones.zone1_max) result.z1++
    else if (bpm <= zones.zone2_max) result.z2++
    else if (bpm <= zones.zone3_max) result.z3++
    else if (bpm <= zones.zone4_max) result.z4++
    else result.z5++
  }
  return result
}

export function aggregateZoneSeconds(streams: ZoneSeconds[]): ZoneSeconds {
  return streams.reduce(
    (acc, s) => ({
      z1: acc.z1 + s.z1,
      z2: acc.z2 + s.z2,
      z3: acc.z3 + s.z3,
      z4: acc.z4 + s.z4,
      z5: acc.z5 + s.z5,
    }),
    { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  )
}

export function zoneSecondsToRows(totals: ZoneSeconds, zones: HRZoneSettings): ZoneRow[] {
  const total = totals.z1 + totals.z2 + totals.z3 + totals.z4 + totals.z5
  const names = [zones.zone1_name, zones.zone2_name, zones.zone3_name, zones.zone4_name, zones.zone5_name]
  const values = [totals.z1, totals.z2, totals.z3, totals.z4, totals.z5]

  return names.map((name, i) => ({
    name,
    color: HR_ZONE_COLORS[i],
    seconds: values[i],
    percent: total > 0 ? Math.round((values[i] / total) * 100) : 0,
  }))
}

// Format seconds as h:mm
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}:${String(m).padStart(2, '0')}`
}
