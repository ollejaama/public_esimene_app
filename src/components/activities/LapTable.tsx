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
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--atlas-rule)' }}>
            {['Lap', 'Distance', 'Time', 'Avg Pace', 'Avg HR', 'Max HR'].map((h, i) => (
              <th key={h} className={`pb-2 font-mono text-[9px] tracking-[0.15em] uppercase text-atlas-faint font-normal ${i === 0 ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {laps.map((lap) => (
            <tr key={lap.lap_index} className="border-b border-dotted border-atlas-rule">
              <td className="py-1.5 font-mono text-[11px] text-atlas-muted">{lap.lap_index}</td>
              <td className="py-1.5 text-right font-mono text-[11px] tabular-nums text-atlas-ink">{formatDistance(lap.distance)}</td>
              <td className="py-1.5 text-right font-mono text-[11px] tabular-nums text-atlas-ink">
                {formatDurationFull(lap.moving_time ?? lap.elapsed_time)}
              </td>
              <td className="py-1.5 text-right font-mono text-[11px] tabular-nums text-atlas-ink">{formatPace(lap.average_speed)}</td>
              <td className="py-1.5 text-right font-mono text-[11px] tabular-nums text-atlas-ink">
                {lap.average_hr ? `${Math.round(lap.average_hr)}` : '—'}
              </td>
              <td className="py-1.5 text-right font-mono text-[11px] tabular-nums text-atlas-ink">
                {lap.max_hr ? `${Math.round(lap.max_hr)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
