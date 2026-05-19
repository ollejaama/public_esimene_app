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
    ? 'Rest days'
    : `Under ${thresholdMinutes}min`

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left cursor-pointer">
        <div className="flex flex-col items-center py-3 px-2">
          <span className="text-xl font-semibold text-gray-700">{restDayCount}</span>
          <span className="text-xs mt-0.5 px-1.5 py-0.5 rounded-full font-medium text-gray-500 bg-gray-100">
            {label}
          </span>
        </div>
      </button>

      {open && (
        <Modal open onClose={() => setOpen(false)} maxWidth="max-w-sm" align="center">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1 pr-8">Rest Days</h2>
            <p className="text-xs text-gray-400 mb-5">
              {restDayCount} {label.toLowerCase()} in this period
              {thresholdMinutes > 0 && ` (threshold: under ${thresholdMinutes} min)`}
            </p>

            {restDayDates.length === 0 ? (
              <p className="text-sm text-gray-400">No rest days in this period.</p>
            ) : (
              <div className="space-y-0.5 max-h-72 overflow-y-auto">
                {restDayDates.map((d) => (
                  <div key={d} className="text-sm text-gray-700 py-1.5 px-2 rounded-md hover:bg-gray-50">
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
