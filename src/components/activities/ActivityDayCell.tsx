'use client'

import { Activity } from '@/lib/supabase/types'
import { SPORT_TYPE_MAP, SPORT_COLORS } from '@/lib/constants'
import { formatDuration } from '@/lib/analytics/hrZones'

interface ActivityDayCellProps {
  date: Date
  activities: Activity[]
  isCurrentMonth: boolean
  onActivityClick: (id: string) => void
}

function getSportColor(activity: Activity): string {
  const key = activity.custom_sport_tag
    ? (activity.custom_sport_tag.includes('rollerski') ? 'Rollerski' : 'Skiing')
    : (SPORT_TYPE_MAP[activity.sport_type] ?? 'Other')
  return SPORT_COLORS[key] ?? SPORT_COLORS.Other
}

export function ActivityDayCell({ date, activities, isCurrentMonth, onActivityClick }: ActivityDayCellProps) {
  const isToday = new Date().toDateString() === date.toDateString()

  return (
    <div className={`min-h-[80px] p-1.5 border-b border-r border-[#f0f0f0] ${!isCurrentMonth ? 'bg-gray-50' : ''}`}>
      <span
        className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${
          isToday
            ? 'bg-gray-900 text-white font-medium'
            : isCurrentMonth
            ? 'text-gray-600'
            : 'text-gray-300'
        }`}
      >
        {date.getDate()}
      </span>

      <div className="mt-1 space-y-0.5">
        {activities.slice(0, 3).map((activity) => (
          <button
            key={activity.id}
            onClick={() => onActivityClick(activity.id)}
            className="w-full text-left"
          >
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: `${getSportColor(activity)}20`,
                color: getSportColor(activity),
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getSportColor(activity) }}
              />
              <span className="truncate">{formatDuration(activity.elapsed_time)}</span>
            </span>
          </button>
        ))}
        {activities.length > 3 && (
          <span className="text-xs text-gray-400 px-1">+{activities.length - 3} more</span>
        )}
      </div>
    </div>
  )
}
