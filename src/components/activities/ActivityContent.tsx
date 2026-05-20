'use client'

import { useState, useMemo } from 'react'
import { Activity, ActivityLap } from '@/lib/supabase/types'
import { ZoneRow, formatDurationFull } from '@/lib/analytics/hrZones'
import { SPORT_TYPE_MAP } from '@/lib/constants'
import { computeSpeedKmh } from '@/lib/analytics/speed'
import { ActivityStatsGrid } from './ActivityStatsGrid'
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
  activitySeconds: number
  showHRChart?: boolean
  elevationData?: number[] | null
  zoneBoundaries?: { zone1_max: number; zone2_max: number; zone3_max: number; zone4_max: number }
  showDangerControls?: boolean
  onIntensityChange?: (val: string) => void
}

function SectionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-atlas-rule pt-4">
      <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-atlas-muted mb-3">{label}</p>
      {children}
    </div>
  )
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

  const secondsPerSample = hasGPS && latlng.length > 0 ? activitySeconds / latlng.length : 1
  const speedData = useMemo(
    () => (hasGPS ? computeSpeedKmh(latlng, secondsPerSample) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [latlng, hasGPS, secondsPerSample]
  )

  const sliderMax = Math.min(
    hasGPS ? latlng.length - 1 : Infinity,
    hrData ? hrData.length - 1 : Infinity
  )
  const [sliderIndex, setSliderIndex] = useState(0)

  const hrHighlightSec = hrData && hrData.length > 0
    ? Math.round(sliderIndex * activitySeconds / hrData.length)
    : sliderIndex
  const gpsHighlightSec = latlng.length > 0
    ? Math.round(sliderIndex * activitySeconds / latlng.length)
    : sliderIndex

  const showSlider = showHRChart && hasGPS && sliderMax > 0 && isFinite(sliderMax)
  const showSpeedChart = showHRChart && hasGPS && speedData !== null
  const showElevationChart = showHRChart && hasGPS && elevationData != null && elevationData.length > 0

  if (activity.is_manual) {
    return (
      <div>
        <SectionBlock label="Stats">
          <ActivityStatsGrid activity={activity} showDangerControls={showDangerControls} onIntensityChange={onIntensityChange} />
        </SectionBlock>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionBlock label="Stats">
        <ActivityStatsGrid activity={activity} showDangerControls={showDangerControls} onIntensityChange={onIntensityChange} />
      </SectionBlock>

      {hasHR && (
        <SectionBlock label="HR Zones">
          <HRZoneTableActivity zones={zoneRows} />
          {showMismatchNote && (
            <p className="mt-2 font-mono text-[9px] text-atlas-faint">
              HR data covers {formatDurationFull(hrCovered)} of {formatDurationFull(activitySeconds)} total
            </p>
          )}
        </SectionBlock>
      )}

      {laps.length > 0 && (
        <SectionBlock label="Laps">
          <LapTable laps={laps} />
        </SectionBlock>
      )}

      {hasGPS && (
        <SectionBlock label="Route">
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
        </SectionBlock>
      )}

      {showHRChart && hrData && hrData.length > 0 && (
        <SectionBlock label="Heart Rate">
          <HRLineChart hrData={hrData} totalSeconds={activitySeconds} zoneBoundaries={zoneBoundaries} highlightIndex={showSlider ? hrHighlightSec : undefined} />
        </SectionBlock>
      )}

      {showSpeedChart && speedData && (
        <SectionBlock label={isRunning ? 'Pace' : 'Speed'}>
          <SpeedLineChart
            speedData={speedData}
            isRunning={isRunning}
            totalSeconds={activitySeconds}
            highlightIndex={showSlider ? gpsHighlightSec : undefined}
          />
        </SectionBlock>
      )}

      {showElevationChart && elevationData && (
        <SectionBlock label="Elevation">
          <ElevationChart
            elevationData={elevationData}
            totalSeconds={activitySeconds}
            highlightIndex={showSlider ? gpsHighlightSec : undefined}
          />
        </SectionBlock>
      )}
    </div>
  )
}
