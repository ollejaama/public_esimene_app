'use client'

import { useState } from 'react'
import { PlannedActivity, Activity, IllnessLog } from '@/lib/supabase/types'
import { WeekNavigator } from '@/components/ui/WeekNavigator'
import { ActivityModal } from '@/components/activities/ActivityModal'
import { PlannedActivityPreviewModal } from '@/components/activities/PlannedActivityPreviewModal'
import { SPORT_COLORS, PLANNED_SPORT_COLOR_KEY, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { getActivityTitle, effectiveSportKey } from '@/lib/activity'
import { ActivityTypeBadge } from '@/components/ui/ActivityTypeBadge'

const ILLNESS_COLORS: Record<string, string> = {
  sick: '#ef4444',
  injured: '#fb923c',
  fatigue: '#facc15',
}

interface CompareWeekViewProps {
  plannedActivities: PlannedActivity[]
  actualActivities: Activity[]
  weekStart: Date
  week: number
  year: number
  isCoach?: boolean
  illnessEntries?: IllnessLog[]
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
  isCoach = false,
  illnessEntries = [],
}: CompareWeekViewProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [selectedPlanned, setSelectedPlanned] = useState<PlannedActivity | null>(null)

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

  // Weekly volume totals
  const plannedTotalMinutes = plannedActivities.reduce((s, a) => s + a.duration_minutes, 0)
  const actualTotalMinutes = Math.round(
    actualActivities.filter((a) => !a.hidden).reduce((s, a) => s + (a.moving_time ?? a.elapsed_time), 0) / 60
  )

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
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Planned{plannedTotalMinutes > 0 ? ` — ${formatDurationMinutes(plannedTotalMinutes)}` : ''}
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Actual{actualTotalMinutes > 0 ? ` — ${formatDurationMinutes(actualTotalMinutes)}` : ''}
        </p>
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {days.map((day, i) => {
          const dateKey = toDateKey(day)
          const planned = plannedMap.get(dateKey) ?? []
          const actual = actualMap.get(dateKey) ?? []
          const isEmpty = planned.length === 0 && actual.length === 0
          const isToday = toDateKey(new Date()) === dateKey

          const dayIllness = illnessEntries.filter((e) => e.start_date <= dateKey && e.end_date >= dateKey)

          return (
            <div
              key={dateKey}
              className={`grid grid-cols-[100px_1fr_1fr] gap-4 border border-[#e5e5e5] rounded-lg p-3 ${isEmpty && dayIllness.length === 0 ? 'opacity-40' : ''}`}
            >
              {/* Day label */}
              <div className="flex flex-col justify-center gap-1">
                <span className={`text-xs font-medium ${isToday ? 'text-gray-900' : 'text-gray-500'}`}>
                  {WEEKDAYS[i]}
                </span>
                <span className="text-xs text-gray-400">
                  {day.getDate()} {day.toLocaleString('en-GB', { month: 'short' })}
                </span>
                {dayIllness.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap">
                    {dayIllness.map((e) => (
                      <span
                        key={e.id}
                        className="text-[9px] font-medium px-1 py-0.5 rounded text-white leading-none"
                        style={{ backgroundColor: ILLNESS_COLORS[e.category] ?? '#888' }}
                      >
                        {e.category}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Planned column */}
              <div className="space-y-1.5">
                {planned.length === 0 ? (
                  <span className="text-xs text-gray-300">—</span>
                ) : (
                  planned.map((a) => {
                    const color = getPlannedColor(a.sport_type)
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedPlanned(a)}
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
                          <span className="truncate font-medium">{a.sport_type}</span>
                          {(a.intensity_type === 'interval' || a.intensity_type === 'speed' || a.intensity_type === 'competition') && (
                            <ActivityTypeBadge intensityType={a.intensity_type} />
                          )}
                          <span className="ml-auto shrink-0 opacity-70">
                            {formatDurationMinutes(a.duration_minutes)}
                          </span>
                        </span>
                      </button>
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
                        className={`w-full text-left ${!isCoach && a.hidden ? 'opacity-40 grayscale' : ''}`}
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
                          {!isCoach && a.hidden && (
                            <svg className="w-2.5 h-2.5 flex-shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                            </svg>
                          )}
                          {!a.hidden && (a.intensity_type === 'interval' || a.intensity_type === 'speed' || a.intensity_type === 'competition') && (
                            <ActivityTypeBadge intensityType={a.intensity_type} />
                          )}
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

      {selectedPlanned && (
        <PlannedActivityPreviewModal
          activity={selectedPlanned}
          onClose={() => setSelectedPlanned(null)}
        />
      )}
    </>
  )
}
