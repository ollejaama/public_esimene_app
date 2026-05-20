import { ZoneRow, formatDurationFull } from '@/lib/analytics/hrZones'

interface HRZoneTableActivityProps {
  zones: ZoneRow[]
}

export function HRZoneTableActivity({ zones }: HRZoneTableActivityProps) {
  const totalSeconds = zones.reduce((sum, z) => sum + z.seconds, 0)

  if (totalSeconds === 0) {
    return (
      <p className="font-serif italic text-[12px] text-atlas-faint">No HR data for this activity.</p>
    )
  }

  const activePct = zones.reduce((sum, z) => sum + Number(z.percent), 0)

  return (
    <div>
      {/* Stacked zone bar */}
      <div className="flex h-2 w-full mb-4 overflow-hidden" style={{ borderTop: '1.5px solid var(--atlas-ink)' }}>
        {zones.map((zone) => {
          const pct = Number(zone.percent)
          if (pct <= 0) return null
          return (
            <div
              key={zone.name}
              style={{ width: `${(pct / activePct) * 100}%`, backgroundColor: zone.color }}
              title={`${zone.name}: ${zone.percent}%`}
            />
          )
        })}
      </div>

      {/* Zone rows */}
      {zones.map((zone) => (
        <div
          key={zone.name}
          className="py-[6px] border-b border-dotted border-atlas-rule"
          style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto auto', gap: '0 12px', alignItems: 'baseline' }}
        >
          <span style={{ width: 8, height: 8, backgroundColor: zone.color, display: 'inline-block', flexShrink: 0, alignSelf: 'center' }} />
          <span className="font-mono text-[11px] tracking-[0.03em] text-atlas-ink">{zone.name}</span>
          <span className="font-mono text-[11px] text-atlas-muted tabular-nums">{formatDurationFull(zone.seconds)}</span>
          <span className="font-mono text-[11px] text-atlas-ink tabular-nums text-right min-w-[32px]">{zone.percent}%</span>
        </div>
      ))}

      <div
        className="pt-[6px]"
        style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto auto', gap: '0 12px', alignItems: 'baseline' }}
      >
        <span />
        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-atlas-muted">Total</span>
        <span className="font-mono text-[11px] text-atlas-ink tabular-nums">{formatDurationFull(totalSeconds)}</span>
        <span className="font-mono text-[11px] text-atlas-faint tabular-nums text-right min-w-[32px]">100%</span>
      </div>
    </div>
  )
}
