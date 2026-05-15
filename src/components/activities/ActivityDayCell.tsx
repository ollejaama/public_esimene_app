'use client'

import { useState } from 'react'
import { Activity, IllnessLog } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { formatDuration } from '@/lib/analytics/hrZones'
import { effectiveContributionSeconds, effectiveSportKey } from '@/lib/activity'
import { SportIcon } from '@/components/ui/SportIcon'
import { ActivityTypeBadge } from '@/components/ui/ActivityTypeBadge'

const ILLNESS_COLORS: Record<string, string> = {
  sick: '#ef4444',
  injured: '#fb923c',
  fatigue: '#facc15',
}

interface ActivityDayCellProps {
  date: Date
  activities: Activity[]
  isCurrentMonth: boolean
  onActivityClick: (activity: Activity) => void
  onDayClick?: () => void
  restDayThresholdMinutes?: number
  illnessEntries?: IllnessLog[]
}

function getSportColor(activity: Activity): string {
  const key = effectiveSportKey(activity)
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

export function ActivityDayCell({ date, activities, isCurrentMonth, onActivityClick, onDayClick, restDayThresholdMinutes = 0, illnessEntries = [] }: ActivityDayCellProps) {
  const isToday = new Date().toDateString() === date.toDateString()
  const [expanded, setExpanded] = useState(false)

  const visibleActivities = expanded ? activities : activities.slice(0, 3)
  const overflowCount = activities.length - 3

  // Rest day: only show for past/today days in the current month
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const isPastOrToday = date <= today
  const dayTotalSeconds = activities
    .filter((a) => !a.hidden)
    .reduce((sum, a) => sum + effectiveContributionSeconds(a), 0)
  // threshold=0 → rest day only when literally zero; threshold>0 → rest day when below threshold
  const isRestDay = isCurrentMonth && isPastOrToday && (
    restDayThresholdMinutes === 0 ? dayTotalSeconds === 0 : dayTotalSeconds < restDayThresholdMinutes * 60
  )

  // Find illness entries that overlap this day
  const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const dayIllness = illnessEntries.filter((e) => e.start_date <= dayKey && e.end_date >= dayKey)
  const illnessColors = Array.from(new Set(dayIllness.map((e) => ILLNESS_COLORS[e.category]).filter(Boolean)))

  return (
    <div
      className={`min-h-[80px] p-1.5 border-b border-r border-[#f0f0f0] cursor-pointer ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
      onClick={() => onDayClick?.()}
    >
      <div className="flex items-center gap-1">
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
        {isRestDay && (
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" title="Rest day" />
        )}
        {illnessColors.map((color, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="mt-1 space-y-0.5">
        {visibleActivities.map((activity) => (
          <button
            key={activity.id}
            onClick={(e) => { e.stopPropagation(); onActivityClick(activity) }}
            className={`w-full text-left ${activity.hidden ? 'opacity-40 grayscale' : ''}`}
          >
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: `${getSportColor(activity)}20`,
                color: getSportColor(activity),
              }}
            >
              <SportIcon sportKey={effectiveSportKey(activity)} className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{formatDuration(effectiveContributionSeconds(activity))}</span>
              {activity.hidden && (
                <svg className="w-2.5 h-2.5 flex-shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
              {activity.is_manual && !activity.hidden && (
                <svg className="w-2.5 h-2.5 flex-shrink-0 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              )}
              {(activity.intensity_type === 'interval' || activity.intensity_type === 'speed' || activity.intensity_type === 'competition') && !activity.hidden && (
                <ActivityTypeBadge intensityType={activity.intensity_type} />
              )}
              {activity.contribution_hours != null && !activity.hidden && (
                <span className="text-[9px] font-bold px-0.5 rounded bg-amber-50 text-amber-600 flex-shrink-0 leading-none">P</span>
              )}
              {activity.coach_comment && !activity.hidden && (
                <span className="relative flex-shrink-0" title="Coach comment">
                  <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  {activity.coach_comment_unread && (
                    <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-red-500" />
                  )}
                </span>
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
