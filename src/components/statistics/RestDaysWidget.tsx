'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface RestDaysWidgetProps {
  restDayCount: number
  thresholdMinutes: number
  restDayDates: string[]
}

function formatRestDate(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function RestDaysWidget({ restDayCount, thresholdMinutes, restDayDates }: RestDaysWidgetProps) {
  const [open, setOpen] = useState(false)
  const label = thresholdMinutes === 0
    ? '< any activity'
    : `< ${thresholdMinutes} min`

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left">
        <div className="flex items-baseline gap-2.5 mb-1.5">
          <span className="font-serif text-[56px] tracking-[-0.03em] leading-none text-atlas-ink">
            {restDayCount}
          </span>
          <span className="font-serif italic text-[13px] text-atlas-muted">
            {restDayCount === 1 ? 'day' : 'days'} at rest
          </span>
        </div>
        <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-atlas-faint">
          threshold · {label}
        </p>
      </button>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center" hideCloseButton>
          <div className="flex items-start justify-between border-b border-atlas-rule bg-atlas-bg" style={{ padding: '16px 20px 14px' }}>
            <div>
              <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink">Rest Days</h2>
              <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
                {restDayCount} days · {label}
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
            {restDayDates.length === 0 ? (
              <p className="font-serif italic text-[13px] text-atlas-faint">No rest days in this period.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {restDayDates.map((d) => (
                  <div key={d} className="font-serif text-[14px] text-atlas-ink py-1.5 border-b border-dotted border-atlas-rule">
                    {formatRestDate(d)}
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
