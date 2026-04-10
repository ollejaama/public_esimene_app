'use client'

import { Activity, ActivityLap } from '@/lib/supabase/types'
import { ZoneRow, formatDurationFull } from '@/lib/analytics/hrZones'
import { ActivityStatsPanel } from './ActivityStatsPanel'
import { HRZoneTableActivity } from './HRZoneTableActivity'
import { LapTable } from './LapTable'
import { LeafletMap } from './LeafletMap'
import { HRLineChart } from './HRLineChart'

interface ActivityContentProps {
  activity: Activity
  zoneRows: ZoneRow[]
  latlng: [number, number][]
  hrData: number[] | null
  laps: ActivityLap[]
  /** Total activity seconds (moving_time or elapsed_time) — used for HR mismatch note */
  activitySeconds: number
  /** When true, show the HR line chart */
  showHRChart?: boolean
}

export function ActivityContent({
  activity,
  zoneRows,
  latlng,
  hrData,
  laps,
  activitySeconds,
  showHRChart = false,
}: ActivityContentProps) {
  const hasHR = zoneRows.some((z) => z.seconds > 0)
  const hrCovered = zoneRows.reduce((sum, z) => sum + z.seconds, 0)
  const showMismatchNote = hasHR && activitySeconds > 0 && hrCovered < activitySeconds * 0.98

  return (
    <div className="space-y-6">
      <div className="border border-[#e5e5e5] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Stats</h2>
        <ActivityStatsPanel activity={activity} />
      </div>

      {hasHR && (
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">HR Zones</h2>
          <HRZoneTableActivity zones={zoneRows} />
          {showMismatchNote && (
            <p className="mt-3 text-xs text-gray-400">
              HR data covers {formatDurationFull(hrCovered)} of {formatDurationFull(activitySeconds)} total activity time
            </p>
          )}
        </div>
      )}

      {laps.length > 0 && (
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Laps</h2>
          <LapTable laps={laps} />
        </div>
      )}

      <div className="border border-[#e5e5e5] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Route</h2>
        <LeafletMap latlng={latlng} />
      </div>

      {showHRChart && hrData && hrData.length > 0 && (
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Heart Rate</h2>
          <HRLineChart hrData={hrData} />
        </div>
      )}
    </div>
  )
}
