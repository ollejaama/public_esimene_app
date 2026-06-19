'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY, CUSTOM_SPORT_TAG_LABELS } from '@/lib/constants'

interface DistanceWidgetProps {
  totalMeters: number
  bySport: { sportKey: string; meters: number }[]
  compact?: boolean
}

function getSportColor(key: string): string {
  if (SPORT_COLORS[key]) return SPORT_COLORS[key]
  const colorKey = CUSTOM_TAG_COLOR_KEY[key]
  return colorKey ? (SPORT_COLORS[colorKey] ?? '#e5e7eb') : '#e5e7eb'
}

function getSportLabel(key: string): string {
  return CUSTOM_SPORT_TAG_LABELS[key as keyof typeof CUSTOM_SPORT_TAG_LABELS] ?? key
}

function formatKm(meters: number): string {
  const km = meters / 1000
  return km >= 100 ? Math.round(km).toString() : km.toFixed(1)
}

export function DistanceWidget({ totalMeters, bySport, compact }: DistanceWidgetProps) {
  const [open, setOpen] = useState(false)

  if (totalMeters <= 0) {
    return <p className="font-serif italic text-[13px] text-atlas-faint">No distance data for this period</p>
  }

  const sorted = [...bySport].sort((a, b) => b.meters - a.meters)
  const maxMeters = sorted[0]?.meters ?? 1

  if (compact) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="w-full text-left">
          <div className="font-serif text-[40px] tracking-[-0.03em] leading-none text-atlas-ink">
            {formatKm(totalMeters)}
          </div>
          <p className="font-serif italic text-[12px] text-atlas-muted mt-1.5">kilometres</p>
        </button>
        {open && (
          <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center" hideCloseButton>
            <div className="flex items-start justify-between border-b border-atlas-rule bg-atlas-bg" style={{ padding: '16px 20px 14px' }}>
              <div>
                <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink">Distance by sport</h2>
                <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">{formatKm(totalMeters)} km total</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors">×</button>
            </div>
            <div style={{ padding: '12px 20px 20px' }}>
              {sorted.map(({ sportKey, meters }) => {
                const pct = (meters / totalMeters) * 100
                const color = getSportColor(sportKey)
                return (
                  <div key={sportKey} className="flex items-center justify-between py-1.5 border-b border-dotted border-atlas-rule">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-serif text-[14px] text-atlas-ink">{getSportLabel(sportKey)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-atlas-muted">{pct.toFixed(0)}%</span>
                      <span className="font-mono text-[12px] text-atlas-ink font-semibold min-w-[60px] text-right">{formatKm(meters)} km</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Modal>
        )}
      </>
    )
  }

  return (
    <>
      <div className="grid gap-8" style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}>
        <button onClick={() => setOpen(true)} className="text-left" style={{ paddingRight: 32, borderRight: '1px solid var(--atlas-rule)', minWidth: 160 }}>
          <div className="font-serif text-[88px] tracking-[-0.04em] leading-[0.95] text-atlas-ink">
            {formatKm(totalMeters)}
          </div>
          <p className="font-serif italic text-[14px] text-atlas-muted mt-1.5">kilometres total</p>
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-atlas-faint mt-1">
            {sorted.length} {sorted.length === 1 ? 'sport' : 'sports'}
          </p>
        </button>

        <div className="flex flex-col gap-1">
          {sorted.map(({ sportKey, meters }) => {
            const barPct = (meters / maxMeters) * 100
            const color = getSportColor(sportKey)
            return (
              <div
                key={sportKey}
                className="grid gap-3 items-center py-1.5 border-b border-dotted border-atlas-rule"
                style={{ gridTemplateColumns: '1.4fr 2fr auto' }}
              >
                <span className="font-serif italic text-[14px] text-atlas-ink">{getSportLabel(sportKey)}</span>
                <div className="h-1.5 atlas-stat-block relative">
                  <div className="absolute inset-0" style={{ width: `${barPct}%`, backgroundColor: color, opacity: 0.75 }} />
                </div>
                <span className="font-mono text-[12px] text-atlas-ink font-semibold text-right min-w-[60px]">
                  {formatKm(meters)} km
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center" hideCloseButton>
          <div className="flex items-start justify-between border-b border-atlas-rule bg-atlas-bg" style={{ padding: '16px 20px 14px' }}>
            <div>
              <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink">Distance by sport</h2>
              <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
                {formatKm(totalMeters)} km total
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <div style={{ padding: '12px 20px 20px' }}>
            {sorted.map(({ sportKey, meters }) => {
              const pct = (meters / totalMeters) * 100
              const color = getSportColor(sportKey)
              return (
                <div key={sportKey} className="flex items-center justify-between py-1.5 border-b border-dotted border-atlas-rule">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-serif text-[14px] text-atlas-ink">{getSportLabel(sportKey)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-atlas-muted">{pct.toFixed(0)}%</span>
                    <span className="font-mono text-[12px] text-atlas-ink font-semibold min-w-[60px] text-right">
                      {formatKm(meters)} km
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal>
      )}
    </>
  )
}
