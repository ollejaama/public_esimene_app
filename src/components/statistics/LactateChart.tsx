'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface LactateWidgetProps {
  avg: number | null
  sessionCount: number
  lactateBySport: { sportKey: string; avgMmol: number }[]
  compact?: boolean
}

export function LactateChart({ avg, sessionCount, lactateBySport, compact }: LactateWidgetProps) {
  const [open, setOpen] = useState(false)

  if (avg === null) {
    return <p className="font-serif italic text-[13px] text-atlas-faint">No lactate data recorded</p>
  }

  const maxAvg = Math.max(...lactateBySport.map((s) => s.avgMmol), 1)

  if (compact) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="w-full text-left">
          <div className="font-serif text-[40px] tracking-[-0.03em] leading-none text-atlas-ink">
            {avg.toFixed(2)}
          </div>
          <p className="font-serif italic text-[12px] text-atlas-muted mt-1.5">mmol/L avg</p>
        </button>
        {open && (
          <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center" hideCloseButton>
            <div className="flex items-start justify-between border-b border-atlas-rule bg-atlas-bg" style={{ padding: '16px 20px 14px' }}>
              <div>
                <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink">Lactate by sport</h2>
                <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">Average mmol/L · {sessionCount} sessions</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors">×</button>
            </div>
            <div style={{ padding: '12px 20px 20px' }}>
              {lactateBySport.length === 0 ? (
                <p className="font-serif italic text-[13px] text-atlas-faint">No lactate data for this period.</p>
              ) : (
                <div>
                  {lactateBySport.map(({ sportKey, avgMmol }) => (
                    <div key={sportKey} className="flex items-center justify-between py-1.5 border-b border-dotted border-atlas-rule">
                      <span className="font-serif text-[14px] text-atlas-ink">{sportKey}</span>
                      <span className="font-mono text-[12px] text-atlas-ink font-semibold">{avgMmol.toFixed(2)} mmol/L</span>
                    </div>
                  ))}
                </div>
              )}
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
            {avg.toFixed(2)}
          </div>
          <p className="font-serif italic text-[14px] text-atlas-muted mt-1.5">season average</p>
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-atlas-faint mt-1">
            {sessionCount} {sessionCount === 1 ? 'measurement' : 'measurements'}
          </p>
        </button>

        <div className="flex flex-col gap-1">
          {lactateBySport.map(({ sportKey, avgMmol }) => {
            const barPct = (avgMmol / maxAvg) * 100
            return (
              <div key={sportKey} className="grid gap-3 items-center py-1.5 border-b border-dotted border-atlas-rule"
                style={{ gridTemplateColumns: '1.4fr 2fr auto' }}>
                <span className="font-serif italic text-[14px] text-atlas-ink">{sportKey}</span>
                <div className="h-1.5 atlas-stat-block relative">
                  <div className="absolute inset-0" style={{ width: `${barPct}%`, backgroundColor: '#c8703a', opacity: 0.75 }} />
                </div>
                <span className="font-mono text-[12px] text-atlas-ink font-semibold text-right min-w-[60px]">{avgMmol.toFixed(2)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center" hideCloseButton>
          <div className="flex items-start justify-between border-b border-atlas-rule bg-atlas-bg" style={{ padding: '16px 20px 14px' }}>
            <div>
              <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink">Lactate by sport</h2>
              <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
                Average mmol/L · {sessionCount} sessions
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
            {lactateBySport.length === 0 ? (
              <p className="font-serif italic text-[13px] text-atlas-faint">No lactate data for this period.</p>
            ) : (
              <div>
                {lactateBySport.map(({ sportKey, avgMmol }) => (
                  <div key={sportKey} className="flex items-center justify-between py-1.5 border-b border-dotted border-atlas-rule">
                    <span className="font-serif text-[14px] text-atlas-ink">{sportKey}</span>
                    <span className="font-mono text-[12px] text-atlas-ink font-semibold">{avgMmol.toFixed(2)} mmol/L</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
