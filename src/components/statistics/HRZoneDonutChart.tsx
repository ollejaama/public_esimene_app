'use client'

import { ZoneRow, formatDuration } from '@/lib/analytics/hrZones'

interface HRZoneDonutChartProps {
  zones: ZoneRow[]
}

export function HRZoneDonutChart({ zones }: HRZoneDonutChartProps) {
  const data = zones.filter((z) => z.seconds > 0)
  const totalSeconds = zones.reduce((sum, z) => sum + z.seconds, 0)

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center font-serif italic text-[13px] text-atlas-faint">
        No HR data
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stacked horizontal bar */}
      <div className="flex h-9 border border-atlas-rule overflow-hidden">
        {data.map((zone, i) => (
          <div
            key={zone.name}
            style={{
              flexBasis: `${zone.percent}%`,
              backgroundColor: zone.color,
              borderRight: i < data.length - 1 ? '1px solid var(--atlas-bg)' : 'none',
            }}
            className="flex items-center justify-center"
          >
            {zone.percent >= 5 && (
              <span className="font-mono text-[9px] font-bold" style={{ color: '#1a1815' }}>
                {zone.percent}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Zone rows */}
      <div>
        {zones.map((zone) => (
          <div
            key={zone.name}
            className="flex items-baseline gap-3 py-[7px] border-b border-dotted border-atlas-rule"
            style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto auto' }}
          >
            <span className="w-[10px] h-[10px] mt-0.5" style={{ backgroundColor: zone.color, display: 'inline-block' }} />
            <span className="font-mono text-[11px] text-atlas-ink font-semibold tracking-[0.05em]">
              {zone.name}
            </span>
            <span className="font-mono text-[11px] text-atlas-muted">
              {formatDuration(zone.seconds)}
            </span>
            <span className="font-mono text-[11px] text-atlas-ink min-w-[32px] text-right">
              {zone.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
