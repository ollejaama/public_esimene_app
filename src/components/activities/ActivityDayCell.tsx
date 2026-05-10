'use client'

import { useState } from 'react'
import { Activity } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { formatDuration } from '@/lib/analytics/hrZones'
import { effectiveDuration, effectiveSportKey } from '@/lib/activity'
import { SportIcon } from '@/components/ui/SportIcon'

interface ActivityDayCellProps {
  date: Date
  activities: Activity[]
  isCurrentMonth: boolean
  onActivityClick: (id: string) => void
}

function getSportColor(activity: Activity): string {
  const key = effectiveSportKey(activity)
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

export function ActivityDayCell({ date, activities, isCurrentMonth, onActivityClick }: ActivityDayCellProps) {
  const isToday = new Date().toDateString() === date.toDateString()
  const [expanded, setExpanded] = useState(false)

  const visibleActivities = expanded ? activities : activities.slice(0, 3)
  const overflowCount = activities.length - 3

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
        {visibleActivities.map((activity) => (
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
              <SportIcon sportKey={effectiveSportKey(activity)} className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{formatDuration(effectiveDuration(activity))}</span>
              {activity.intensity_type === 'interval' && (
                <span className="text-[9px] font-bold px-0.5 rounded bg-red-100 text-red-600 flex-shrink-0 leading-none">INT</span>
              )}
              {activity.intensity_type === 'speed' && (
                <span className="text-[9px] font-bold px-0.5 rounded bg-blue-100 text-blue-600 flex-shrink-0 leading-none">SPD</span>
              )}
            </span>
          </button>
        ))}

        {!expanded && overflowCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
            className="text-xs text-gray-400 hover:text-gray-600 px-1 transition-colors"
          >
            +{overflowCount} more
          </button>
        )}
        {expanded && overflowCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
            className="text-xs text-gray-400 hover:text-gray-600 px-1 transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  )
}
