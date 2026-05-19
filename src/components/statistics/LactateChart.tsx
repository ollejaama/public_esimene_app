'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface LactateWidgetProps {
  avg: number | null
  sessionCount: number
  lactateBySport: { sportKey: string; avgMmol: number }[]
}

export function LactateChart({ avg, sessionCount, lactateBySport }: LactateWidgetProps) {
  const [open, setOpen] = useState(false)

  if (avg === null) {
    return <p className="text-xs text-gray-400">No lactate data recorded</p>
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-left cursor-pointer hover:opacity-80 transition-opacity"
        title="View per-sport breakdown"
      >
        <p className="text-4xl font-bold text-gray-900 leading-none">{avg.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-1">mmol/L avg · {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}</p>
      </button>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1 pr-8">Lactate by sport</h2>
            <p className="text-xs text-gray-400 mb-5">Average lactate per sport for this period</p>

            {lactateBySport.length === 0 ? (
              <p className="text-sm text-gray-400">No lactate data for this period.</p>
            ) : (
              <div className="space-y-1">
                {lactateBySport.map(({ sportKey, avgMmol }) => (
                  <div key={sportKey} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50">
                    <span className="text-sm text-gray-700">{sportKey}</span>
                    <span className="text-sm font-semibold text-gray-900">{avgMmol.toFixed(2)} mmol/L</span>
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
