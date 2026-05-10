'use client'

import { useState } from 'react'
import { PlannedActivity, Activity } from '@/lib/supabase/types'
import { WeekNavigator } from '@/components/dashboard/WeekNavigator'
import { ActivityModal } from '@/components/activities/ActivityModal'
import { SPORT_COLORS, PLANNED_SPORT_COLOR_KEY, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { getActivityTitle, effectiveSportKey } from '@/lib/activity'

interface CompareWeekViewProps {
  plannedActivities: PlannedActivity[]
  actualActivities: Activity[]
  weekStart: Date
  week: number
  year: number
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDurationMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function formatDurationSeconds(seconds: number): string {
  return formatDurationMinutes(Math.round(seconds / 60))
}

function getPlannedColor(sportType: string): string {
  const key = PLANNED_SPORT_COLOR_KEY[sportType] ?? 'Other'
  return SPORT_COLORS[key] ?? SPORT_COLORS.Other
}

function getActualColor(activity: Activity): string {
  const key = effectiveSportKey(activity)
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

export function CompareWeekView({
  plannedActivities,
  actualActivities,
  weekStart,
  week,
  year,
}: CompareWeekViewProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

  const plannedMap = new Map<string, PlannedActivity[]>()
  for (const a of plannedActivities) {
    const existing = plannedMap.get(a.date) ?? []
    plannedMap.set(a.date, [...existing, a])
  }

  const actualMap = new Map<string, Activity[]>()
  for (const a of actualActivities) {
    const key = toDateKey(new Date(a.start_date))
    const existing = actualMap.get(key) ?? []
    actualMap.set(key, [...existing, a])
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Compare</h1>
        <WeekNavigator week={week} year={year} basePath="/compare" />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[100px_1fr_1fr] gap-4 mb-2 px-1">
        <div />
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Planned</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Actual</p>
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {days.map((day, i) => {
          const dateKey = toDateKey(day)
          const planned = plannedMap.get(dateKey) ?? []
          const actual = actualMap.get(dateKey) ?? []
          const isEmpty = planned.length === 0 && actual.length === 0
          const isToday = toDateKey(new Date()) === dateKey

          return (
            <div
              key={dateKey}
              className={`grid grid-cols-[100px_1fr_1fr] gap-4 border border-[#e5e5e5] rounded-lg p-3 ${isEmpty ? 'opacity-40' : ''}`}
            >
              {/* Day label */}
              <div className="flex flex-col justify-center">
                <span className={`text-xs font-medium ${isToday ? 'text-gray-900' : 'text-gray-500'}`}>
                  {WEEKDAYS[i]}
                </span>
                <span className="text-xs text-gray-400">
                  {day.getDate()} {day.toLocaleString('en-GB', { month: 'short' })}
                </span>
              </div>

              {/* Planned column */}
              <div className="space-y-1.5">
                {planned.length === 0 ? (
                  <span className="text-xs text-gray-300">—</span>
                ) : (
                  planned.map((a) => {
                    const color = getPlannedColor(a.sport_type)
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate font-medium">{a.sport_type}</span>
                        <span className="ml-auto shrink-0 opacity-70">
                          {formatDurationMinutes(a.duration_minutes)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Actual column */}
              <div className="space-y-1.5">
                {actual.length === 0 ? (
                  <span className="text-xs text-gray-300">—</span>
                ) : (
                  actual.map((a) => {
                    const color = getActualColor(a)
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedActivityId(a.id)}
                        className="w-full text-left"
                      >
                        <span
                          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate font-medium">{getActivityTitle(a)}</span>
                          <span className="ml-auto shrink-0 opacity-70">
                            {formatDurationSeconds(a.moving_time ?? a.elapsed_time)}
                          </span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ActivityModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </>
  )
}
