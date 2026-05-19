'use client'

import { useState, useMemo } from 'react'
import { Activity, ActivityLap } from '@/lib/supabase/types'
import { ZoneRow, formatDurationFull } from '@/lib/analytics/hrZones'
import { SPORT_TYPE_MAP } from '@/lib/constants'
import { computeSpeedKmh } from '@/lib/analytics/speed'
import { ActivityStatsPanel } from './ActivityStatsPanel'
import { HRZoneTableActivity } from './HRZoneTableActivity'
import { LapTable } from './LapTable'
import { LeafletMap } from './LeafletMap'
import { HRLineChart } from './HRLineChart'
import { SpeedLineChart } from './SpeedLineChart'
import { ElevationChart } from './ElevationChart'

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
  /** Elevation data from GPS stream (one meter value per second) */
  elevationData?: number[] | null
  zoneBoundaries?: { zone1_max: number; zone2_max: number; zone3_max: number; zone4_max: number }
  showDangerControls?: boolean
  onIntensityChange?: (val: string) => void
}

export function ActivityContent({
  activity,
  zoneRows,
  latlng,
  hrData,
  laps,
  activitySeconds,
  showHRChart = false,
  elevationData,
  zoneBoundaries,
  showDangerControls = true,
  onIntensityChange,
}: ActivityContentProps) {
  const hasHR = zoneRows.some((z) => z.seconds > 0)
  const hrCovered = zoneRows.reduce((sum, z) => sum + z.seconds, 0)
  const showMismatchNote = hasHR && activitySeconds > 0 && hrCovered < activitySeconds * 0.98

  const hasGPS = latlng.length > 0
  const isRunning = (SPORT_TYPE_MAP[activity.sport_type] ?? 'Other') === 'Running'

  // Compute speed from GPS (memoized — only when GPS data is present)
  // secondsPerSample corrects for Strava streams sampled at less than 1 Hz
  const secondsPerSample = hasGPS && latlng.length > 0 ? activitySeconds / latlng.length : 1
  const speedData = useMemo(
    () => (hasGPS ? computeSpeedKmh(latlng, secondsPerSample) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [latlng, hasGPS, secondsPerSample]
  )

  // Slider scrub index — shared across map, HR chart, and speed chart
  const sliderMax = Math.min(
    hasGPS ? latlng.length - 1 : Infinity,
    hrData ? hrData.length - 1 : Infinity
  )
  const [sliderIndex, setSliderIndex] = useState(0)

  // Scale slider index to actual seconds for each chart's ReferenceLine
  const hrHighlightSec = hrData && hrData.length > 0
    ? Math.round(sliderIndex * activitySeconds / hrData.length)
    : sliderIndex
  const gpsHighlightSec = latlng.length > 0
    ? Math.round(sliderIndex * activitySeconds / latlng.length)
    : sliderIndex

  const showSlider = showHRChart && hasGPS && sliderMax > 0 && isFinite(sliderMax)
  const showSpeedChart = showHRChart && hasGPS && speedData !== null
  const showElevationChart = showHRChart && hasGPS && elevationData != null && elevationData.length > 0

  // Manual activities have no GPS/HR/lap data — show only stats
  if (activity.is_manual) {
    return (
      <div className="space-y-6">
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Stats</h2>
          <ActivityStatsPanel activity={activity} showDangerControls={showDangerControls} onIntensityChange={onIntensityChange} />
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="border border-[#e5e5e5] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Stats</h2>
        <ActivityStatsPanel activity={activity} showDangerControls={showDangerControls} onIntensityChange={onIntensityChange} />
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

      {hasGPS && (
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Route</h2>
          <LeafletMap latlng={latlng} highlightIndex={showSlider ? sliderIndex : undefined} />
          {showSlider && (
            <input
              type="range"
              min={0}
              max={sliderMax}
              value={sliderIndex}
              onChange={(e) => setSliderIndex(Number(e.target.value))}
              className="w-full mt-3 accent-orange-500"
            />
          )}
        </div>
      )}

      {showHRChart && hrData && hrData.length > 0 && (
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Heart Rate</h2>
          <HRLineChart hrData={hrData} totalSeconds={activitySeconds} zoneBoundaries={zoneBoundaries} highlightIndex={showSlider ? hrHighlightSec : undefined} />
        </div>
      )}

      {showSpeedChart && speedData && (
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {isRunning ? 'Pace' : 'Speed'}
          </h2>
          <SpeedLineChart
            speedData={speedData}
            isRunning={isRunning}
            totalSeconds={activitySeconds}
            highlightIndex={showSlider ? gpsHighlightSec : undefined}
          />
        </div>
      )}

      {showElevationChart && elevationData && (
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Elevation</h2>
          <ElevationChart
            elevationData={elevationData}
            totalSeconds={activitySeconds}
            highlightIndex={showSlider ? gpsHighlightSec : undefined}
          />
        </div>
      )}
    </div>
  )
}
