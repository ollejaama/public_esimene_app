'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { IllnessLog } from '@/lib/supabase/types'

interface IllnessWidgetProps {
  illnessEntries: IllnessLog[]
  start: Date
  end: Date
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  sick: { label: 'Sick', color: '#a23b2a' },
  injured: { label: 'Injured', color: '#c8703a' },
  fatigue: { label: 'Fatigue', color: '#c6a24a' },
}

function countAffectedDays(entries: IllnessLog[], start: Date, end: Date): number {
  const affected = new Set<string>()
  const cursor = new Date(start)
  while (cursor < end) {
    const key = cursor.toISOString().slice(0, 10)
    for (const e of entries) {
      if (e.start_date <= key && e.end_date >= key) {
        affected.add(key)
        break
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return affected.size
}

function countByCategory(entries: IllnessLog[], start: Date, end: Date, category: string): number {
  const filtered = entries.filter((e) => e.category === category)
  return countAffectedDays(filtered, start, end)
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (start === end) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start + 'T12:00:00')
  const b = new Date(end + 'T12:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1
}

export function IllnessWidget({ illnessEntries, start, end }: IllnessWidgetProps) {
  const [open, setOpen] = useState(false)

  const total = countAffectedDays(illnessEntries, start, end)
  const breakdown = Object.entries(CATEGORY_META).map(([cat, meta]) => ({
    ...meta,
    count: countByCategory(illnessEntries, start, end, cat),
  })).filter((b) => b.count > 0)

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left">
        <div className="flex items-baseline gap-2.5 mb-1.5">
          <span className="font-serif text-[56px] tracking-[-0.03em] leading-none text-atlas-ink">
            {total}
          </span>
          <span className="font-serif italic text-[13px] text-atlas-muted">
            affected days
          </span>
        </div>
        {breakdown.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {breakdown.map((b) => (
              <div key={b.label} className="grid gap-2.5 items-center" style={{ gridTemplateColumns: '12px 1fr auto' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                <span className="font-serif italic text-[12px] text-atlas-muted">{b.label}</span>
                <span className="font-mono text-[11px] text-atlas-ink">{b.count}d</span>
              </div>
            ))}
          </div>
        )}
      </button>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center" hideCloseButton>
          <div className="flex items-start justify-between border-b border-atlas-rule bg-atlas-bg" style={{ padding: '16px 20px 14px' }}>
            <div>
              <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink">Health</h2>
              <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
                {total} affected {total === 1 ? 'day' : 'days'}
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
            {illnessEntries.length === 0 ? (
              <p className="font-serif italic text-[13px] text-atlas-faint">No illness or injury entries for this period.</p>
            ) : (
              <div className="space-y-2">
                {illnessEntries.map((entry) => {
                  const meta = CATEGORY_META[entry.category]
                  const days = daysBetween(entry.start_date, entry.end_date)
                  return (
                    <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-dotted border-atlas-rule">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: meta?.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-[14px] text-atlas-ink">{meta?.label ?? entry.category}</span>
                          <span className="font-serif italic text-[12px] text-atlas-muted">{formatDateRange(entry.start_date, entry.end_date)}</span>
                          <span className="font-mono text-[11px] text-atlas-muted ml-auto">{days}d</span>
                        </div>
                        {entry.notes && <p className="font-serif italic text-[12px] text-atlas-faint mt-0.5">{entry.notes}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
