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
      <div className="flex flex-col items-center py-3 px-2">
        <span className="text-xs text-gray-400">No RPE data</span>
      </div>
    )
  }

  const avg = withRpe.reduce((s, a) => s + a.rpe!, 0) / withRpe.length
  const scaleLabel = scale === 'rpe' ? 'RPE (1–10)' : 'Borg (6–20)'

  const bySport = new Map<string, { sum: number; count: number }>()
  for (const a of withRpe) {
    const sport = a.sport_type ?? 'Other'
    const entry = bySport.get(sport) ?? { sum: 0, count: 0 }
    bySport.set(sport, { sum: entry.sum + a.rpe!, count: entry.count + 1 })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left cursor-pointer">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-gray-900 leading-none">{avg.toFixed(1)}</span>
          <span className="text-xs text-gray-400 mb-0.5">{scaleLabel} avg · {withRpe.length} sessions</span>
        </div>
      </button>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1 pr-8">Effort Rating</h2>
            <p className="text-xs text-gray-400 mb-5">
              {scaleLabel} · avg {avg.toFixed(1)} across {withRpe.length} sessions
            </p>

            {bySport.size === 0 ? (
              <p className="text-sm text-gray-400">No sessions with RPE data.</p>
            ) : (
              <div className="space-y-1">
                {Array.from(bySport.entries()).map(([sport, { sum, count }]) => (
                  <div key={sport} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50">
                    <span className="text-sm text-gray-700">{sport}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{count} session{count !== 1 ? 's' : ''}</span>
                      <span className="font-semibold text-gray-900 text-sm">{(sum / count).toFixed(1)}</span>
                    </div>
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
