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
  sick: { label: 'Sick', color: '#ef4444' },
  injured: { label: 'Injured', color: '#fb923c' },
  fatigue: { label: 'Fatigue', color: '#facc15' },
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
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left cursor-pointer"
      >
        {total === 0 ? (
          <div className="flex flex-col items-center py-3 px-2">
            <span className="text-3xl font-bold text-gray-900 leading-none">0</span>
            <span className="text-xs text-gray-400 mt-0.5">affected days</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900 leading-none">{total}</span>
              <span className="text-xs text-gray-400 mb-0.5">affected days</span>
            </div>
            {breakdown.length > 0 && (
              <div className="space-y-1">
                {breakdown.map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                    <span className="text-gray-600 flex-1">{b.label}</span>
                    <span className="font-medium text-gray-800">{b.count}d</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </button>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1 pr-8">Health</h2>
            <p className="text-xs text-gray-400 mb-5">{total} affected {total === 1 ? 'day' : 'days'} in this period</p>

            {illnessEntries.length === 0 ? (
              <p className="text-sm text-gray-400">No illness or injury entries for this period.</p>
            ) : (
              <div className="space-y-2">
                {illnessEntries.map((entry) => {
                  const meta = CATEGORY_META[entry.category]
                  const days = daysBetween(entry.start_date, entry.end_date)
                  return (
                    <div key={entry.id} className="flex items-start gap-3 py-2 px-2 rounded-lg bg-gray-50">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: meta?.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700">{meta?.label ?? entry.category}</span>
                          <span className="text-xs text-gray-400">{formatDateRange(entry.start_date, entry.end_date)}</span>
                          <span className="text-xs text-gray-400 ml-auto">{days}d</span>
                        </div>
                        {entry.notes && <p className="text-xs text-gray-500 mt-0.5">{entry.notes}</p>}
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
