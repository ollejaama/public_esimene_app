'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Activity } from '@/lib/supabase/types'

interface RPEWidgetProps {
  activities: Activity[]
  scale: 'rpe' | 'borg'
}

export function RPEWidget({ activities, scale }: RPEWidgetProps) {
  const [open, setOpen] = useState(false)

  const withRpe = activities.filter((a) => a.rpe != null)
  if (withRpe.length === 0) {
    return (
      <p className="font-serif italic text-[13px] text-atlas-faint">No RPE data recorded</p>
    )
  }

  const avg = withRpe.reduce((s, a) => s + a.rpe!, 0) / withRpe.length
  const scaleMax = scale === 'rpe' ? 10 : 20
  const scaleLabel = scale === 'rpe' ? 'RPE (1–10)' : 'Borg (6–20)'

  const bySport = new Map<string, { sum: number; count: number }>()
  for (const a of withRpe) {
    const sport = a.sport_type ?? 'Other'
    const entry = bySport.get(sport) ?? { sum: 0, count: 0 }
    bySport.set(sport, { sum: entry.sum + a.rpe!, count: entry.count + 1 })
  }

  return (
    <>
      <div className="grid gap-8" style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}>
        <button onClick={() => setOpen(true)} className="text-left" style={{ paddingRight: 32, borderRight: '1px solid var(--atlas-rule)', minWidth: 160 }}>
          <div className="font-serif text-[88px] tracking-[-0.04em] leading-[0.95] text-atlas-ink">
            {avg.toFixed(1)}
          </div>
          <p className="font-serif italic text-[14px] text-atlas-muted mt-1.5">average effort</p>
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-atlas-faint mt-1">
            across {withRpe.length} sessions
          </p>
        </button>

        <div className="flex flex-col gap-1">
          {Array.from(bySport.entries()).map(([sport, { sum, count }]) => {
            const sportAvg = sum / count
            const barPct = (sportAvg / scaleMax) * 100
            return (
              <div key={sport} className="grid gap-3 items-center py-1.5 border-b border-dotted border-atlas-rule"
                style={{ gridTemplateColumns: '1.4fr 2fr auto auto' }}>
                <span className="font-serif italic text-[14px] text-atlas-ink">{sport}</span>
                <div className="h-1.5 atlas-stat-block relative">
                  <div className="absolute inset-0" style={{ width: `${barPct}%`, backgroundColor: 'var(--atlas-accent)', opacity: 0.7 }} />
                </div>
                <span className="font-mono text-[10px] text-atlas-muted">{count} session{count !== 1 ? 's' : ''}</span>
                <span className="font-mono text-[12px] text-atlas-ink font-semibold text-right min-w-[32px]">{sportAvg.toFixed(1)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center" hideCloseButton>
          <div className="flex items-start justify-between border-b border-atlas-rule bg-atlas-bg" style={{ padding: '16px 20px 14px' }}>
            <div>
              <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink">Effort Rating</h2>
              <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
                {scaleLabel} · avg {avg.toFixed(1)} across {withRpe.length} sessions
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
            {Array.from(bySport.entries()).map(([sport, { sum, count }]) => (
              <div key={sport} className="flex items-center justify-between py-1.5 border-b border-dotted border-atlas-rule">
                <span className="font-serif text-[14px] text-atlas-ink">{sport}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-atlas-muted">{count} session{count !== 1 ? 's' : ''}</span>
                  <span className="font-mono text-[12px] text-atlas-ink font-semibold">{(sum / count).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}
