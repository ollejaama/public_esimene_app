'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlannedActivity, TrainingCamp, PlannedRestDay } from '@/lib/supabase/types'
import { WeekNavigator } from '@/components/ui/WeekNavigator'
import { PlanActivityModal } from './PlanActivityModal'
import { CampModal } from './CampModal'
import { SPORT_COLORS, PLANNED_SPORT_COLOR_KEY } from '@/lib/constants'
import { ActivityTypeBadge } from '@/components/ui/ActivityTypeBadge'
import { toDateStr, getSeasonYear, fmtDateDisplay } from '@/lib/planUtils'

interface PlanWeekViewProps {
  plannedActivities: PlannedActivity[]
  camps: TrainingCamp[]
  restDays: PlannedRestDay[]
  weekStart: Date
  week: number
  year: number
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

function getSportColor(sportType: string): string {
  const key = PLANNED_SPORT_COLOR_KEY[sportType] ?? 'Other'
  return SPORT_COLORS[key] ?? SPORT_COLORS.Other
}

interface ModalState {
  mode: 'add' | 'edit'
  date: string
  activity?: PlannedActivity
  timeOfDay: 'morning' | 'evening'
}

export function PlanWeekView({ plannedActivities, camps, restDays, weekStart, week, year }: PlanWeekViewProps) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalState | null>(null)
  const [campModal, setCampModal] = useState<{ mode: 'add' | 'edit'; camp?: TrainingCamp } | null>(null)
  const [restDaySet, setRestDaySet] = useState<Set<string>>(new Set(restDays.map((r) => r.date)))

  // Build a map: dateKey → PlannedActivity[]
  const activityMap = new Map<string, PlannedActivity[]>()
  for (const a of plannedActivities) {
    const existing = activityMap.get(a.date) ?? []
    activityMap.set(a.date, [...existing, a])
  }

  // Build the 7 days of the week
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  function handleSaved() {
    setModal(null)
    router.refresh()
  }

  function handleCampSaved() {
    setCampModal(null)
    router.refresh()
  }

  async function toggleRestDay(dateKey: string) {
    const isRest = restDaySet.has(dateKey)
    // Optimistic update
    setRestDaySet((prev) => {
      const next = new Set(prev)
      if (isRest) next.delete(dateKey)
      else next.add(dateKey)
      return next
    })
    try {
      if (isRest) {
        await fetch(`/api/planned-rest-days/${dateKey}`, { method: 'DELETE' })
      } else {
        await fetch('/api/planned-rest-days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateKey }),
        })
      }
    } catch {
      // Revert on failure
      setRestDaySet((prev) => {
        const next = new Set(prev)
        if (isRest) next.add(dateKey)
        else next.delete(dateKey)
        return next
      })
    }
  }

  // Date range label: "11 May, Mon → 17 May, Sun"
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  // Camps overlapping this week
  const weekEndStr = toDateStr(weekEnd)
  const weekStartStr = toDateStr(weekStart)
  const overlappingCamps = camps.filter((c) => c.start_date <= weekEndStr && c.end_date >= weekStartStr)

  function fmtDay(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const wd = d.toLocaleString('en-GB', { weekday: 'short' })
    return `${dd}/${mm}/${yyyy} ${wd}`
  }
  const dateRangeLabel = `${fmtDay(weekStart)} → ${fmtDay(weekEnd)}`

  // Total planned minutes this week
  const totalMinutes = plannedActivities.reduce((sum, a) => sum + a.duration_minutes, 0)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Plan</h1>
            <p className="text-xs text-gray-400 mt-0.5">Week {week} — {dateRangeLabel}</p>
          </div>
          {/* View tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => router.push(`/plan?view=season&year=${getSeasonYear(weekStart)}`)}
              className="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
            >
              Season
            </button>
            <button
              onClick={() => router.push(`/plan?view=month&month=${weekStart.getMonth() + 1}&year=${weekStart.getFullYear()}`)}
              className="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
            >
              Month
            </button>
            <span className="px-3 py-1.5 rounded-md bg-white shadow-sm font-semibold text-gray-900">Week</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCampModal({ mode: 'add' })}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add camp
          </button>
          <div className="flex flex-col items-end gap-1">
            <WeekNavigator week={week} year={year} basePath="/plan" />
            {totalMinutes > 0 ? (
              <span className="text-xs text-gray-500">{formatDurationMinutes(totalMinutes)} planned</span>
            ) : (
              <span className="text-xs text-gray-300">No sessions planned</span>
            )}
          </div>
        </div>
      </div>

      {/* Camp banner */}
      {overlappingCamps.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
          <span className="text-sm">⛺</span>
          <div className="flex flex-wrap gap-2">
            {overlappingCamps.map((camp) => (
              <button
                key={camp.id}
                onClick={() => setCampModal({ mode: 'edit', camp })}
                className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
              >
                {camp.name}
                <span className="ml-1 text-xs text-blue-400 font-normal">
                  ({fmtDateDisplay(camp.start_date)} – {fmtDateDisplay(camp.end_date)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((day, i) => {
          const dateKey = toDateKey(day)
          const activities = activityMap.get(dateKey) ?? []
          const morning = activities.filter((a) => (a.time_of_day ?? 'morning') === 'morning')
          const evening = activities.filter((a) => a.time_of_day === 'evening')
          const isToday = toDateKey(new Date()) === dateKey
          const isRest = restDaySet.has(dateKey)
          const inCamp = camps.some((c) => c.start_date <= dateKey && c.end_date >= dateKey)
          const dayLabel = WEEKDAYS[i]
          const dayNum = day.getDate()
          const monthLabel = day.toLocaleString('en-GB', { month: 'short' })

          return (
            <div
              key={dateKey}
              className={`rounded-lg p-3 flex flex-col min-h-[200px] shadow-sm border ${
                isRest
                  ? 'bg-gray-50 border-gray-200'
                  : inCamp
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-white border-[#e5e5e5]'
              }`}
            >
              {/* Day header */}
              <div className="mb-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {dayLabel}
                  </span>
                  {isRest && (
                    <span className="text-[9px] font-medium text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">REST</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-sm font-semibold ${isToday ? 'text-gray-900 underline' : 'text-gray-700'}`}>
                    {dayNum}
                  </span>
                  <span className="text-xs text-gray-400">{monthLabel}</span>
                </div>
              </div>

              {/* Morning section */}
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1">☀ Morning</p>
                <div className="space-y-1 mb-1.5">
                  {morning.map((a) => {
                    const color = a.intensity_type === 'interval' ? '#ef4444' : getSportColor(a.sport_type)
                    const isComp = a.intensity_type === 'competition'
                    return (
                      <button
                        key={a.id}
                        onClick={() => setModal({ mode: 'edit', date: dateKey, activity: a, timeOfDay: 'morning' })}
                        className="w-full text-left"
                      >
                        {isComp ? (
                          <span className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold hover:opacity-80 transition-opacity bg-amber-400 text-white border border-amber-500 shadow-sm">
                            <span className="shrink-0">★</span>
                            <span className="truncate">{a.sport_type}</span>
                            <span className="ml-auto shrink-0 opacity-90">{formatDurationMinutes(a.duration_minutes)}</span>
                          </span>
                        ) : (
                          <span
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: `${color}30`, color }}
                          >
                            <span className="truncate">{a.sport_type}</span>
                            {(a.intensity_type === 'interval' || a.intensity_type === 'speed') && (
                              <ActivityTypeBadge intensityType={a.intensity_type} />
                            )}
                            <span className="ml-auto shrink-0 opacity-70">{formatDurationMinutes(a.duration_minutes)}</span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setModal({ mode: 'add', date: dateKey, timeOfDay: 'morning' })}
                  className="text-[10px] text-gray-300 hover:text-gray-600 transition-colors flex items-center gap-0.5"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-[#f0f0f0] my-2" />

              {/* Evening section */}
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1">☽ Evening</p>
                <div className="space-y-1 mb-1.5">
                  {evening.map((a) => {
                    const color = a.intensity_type === 'interval' ? '#ef4444' : getSportColor(a.sport_type)
                    const isComp = a.intensity_type === 'competition'
                    return (
                      <button
                        key={a.id}
                        onClick={() => setModal({ mode: 'edit', date: dateKey, activity: a, timeOfDay: 'evening' })}
                        className="w-full text-left"
                      >
                        {isComp ? (
                          <span className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold hover:opacity-80 transition-opacity bg-amber-400 text-white border border-amber-500 shadow-sm">
                            <span className="shrink-0">★</span>
                            <span className="truncate">{a.sport_type}</span>
                            <span className="ml-auto shrink-0 opacity-90">{formatDurationMinutes(a.duration_minutes)}</span>
                          </span>
                        ) : (
                          <span
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: `${color}30`, color }}
                          >
                            <span className="truncate">{a.sport_type}</span>
                            {(a.intensity_type === 'interval' || a.intensity_type === 'speed') && (
                              <ActivityTypeBadge intensityType={a.intensity_type} />
                            )}
                            <span className="ml-auto shrink-0 opacity-70">{formatDurationMinutes(a.duration_minutes)}</span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setModal({ mode: 'add', date: dateKey, timeOfDay: 'evening' })}
                  className="text-[10px] text-gray-300 hover:text-gray-600 transition-colors flex items-center gap-0.5"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add
                </button>
              </div>

              {/* Rest day toggle */}
              <div className="border-t border-[#f0f0f0] mt-2 pt-2">
                <button
                  onClick={() => toggleRestDay(dateKey)}
                  className={`flex items-center gap-1.5 text-[10px] transition-colors ${
                    isRest ? 'text-gray-500 font-medium' : 'text-gray-300 hover:text-gray-500'
                  }`}
                >
                  <span>{isRest ? '🌙' : '○'}</span>
                  <span>Rest day</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <PlanActivityModal
          mode={modal.mode}
          date={modal.date}
          activity={modal.activity}
          initialTimeOfDay={modal.timeOfDay}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {campModal && (
        <CampModal
          mode={campModal.mode}
          camp={campModal.camp}
          defaultStartDate={weekStartStr}
          onClose={() => setCampModal(null)}
          onSaved={handleCampSaved}
        />
      )}
    </>
  )
}
