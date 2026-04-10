import { ActivityLap } from '@/lib/supabase/types'
import { formatDurationFull } from '@/lib/analytics/hrZones'

interface LapTableProps {
  laps: ActivityLap[]
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`
}

function formatPace(speedMs: number | null): string {
  if (!speedMs || speedMs <= 0) return '—'
  const secsPerKm = 1000 / speedMs
  const m = Math.floor(secsPerKm / 60)
  const s = Math.round(secsPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function LapTable({ laps }: LapTableProps) {
  if (laps.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 border-b border-[#f0f0f0]">
            <th className="text-left pb-2 font-normal">Lap</th>
            <th className="text-right pb-2 font-normal">Distance</th>
            <th className="text-right pb-2 font-normal">Time</th>
            <th className="text-right pb-2 font-normal">Avg Pace</th>
            <th className="text-right pb-2 font-normal">Avg HR</th>
            <th className="text-right pb-2 font-normal">Max HR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f9f9f9]">
          {laps.map((lap) => (
            <tr key={lap.lap_index}>
              <td className="py-1.5 text-gray-500 text-xs">{lap.lap_index}</td>
              <td className="py-1.5 text-right font-mono text-xs tabular-nums">{formatDistance(lap.distance)}</td>
              <td className="py-1.5 text-right font-mono text-xs tabular-nums">
                {formatDurationFull(lap.moving_time ?? lap.elapsed_time)}
              </td>
              <td className="py-1.5 text-right text-xs tabular-nums">{formatPace(lap.average_speed)}</td>
              <td className="py-1.5 text-right text-xs tabular-nums">
                {lap.average_hr ? `${Math.round(lap.average_hr)} bpm` : '—'}
              </td>
              <td className="py-1.5 text-right text-xs tabular-nums">
                {lap.max_hr ? `${Math.round(lap.max_hr)} bpm` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
