'use client'

import { Modal } from '@/components/ui/Modal'
import { PlannedActivity } from '@/lib/supabase/types'

interface PlannedActivityPreviewModalProps {
  activity: PlannedActivity
  onClose: () => void
}

function formatDurationMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function PlannedActivityPreviewModal({ activity, onClose }: PlannedActivityPreviewModalProps) {
  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm" align="center">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-2 pr-6 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-900">{activity.sport_type}</h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none ${
              activity.time_of_day === 'evening'
                ? 'bg-indigo-50 text-indigo-500'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {activity.time_of_day === 'evening' ? '☽ Evening' : '☀ Morning'}
            </span>
            {activity.intensity_type === 'interval' && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-600 leading-none">INT</span>
            )}
            {activity.intensity_type === 'speed' && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-600 leading-none">SPD</span>
            )}
            {activity.intensity_type === 'competition' && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none">★ COMP</span>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="px-1">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Duration</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDurationMinutes(activity.duration_minutes)}</p>
        </div>

        {/* Description */}
        <div className="px-1">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">Notes</p>
          {activity.description ? (
            <p className="text-sm text-gray-700">{activity.description}</p>
          ) : (
            <p className="text-sm text-gray-300">No description</p>
          )}
        </div>

        {/* Close */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
