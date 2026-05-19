'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlannedActivity, TrainingCamp, PlannedRestDay } from '@/lib/supabase/types'
import { getISOWeek } from '@/lib/analytics/weekSummary'
import { toDateStr, getSeasonYear } from '@/lib/planUtils'
import { SPORT_COLORS, PLANNED_SPORT_COLOR_KEY } from '@/lib/constants'
import { CampModal } from './CampModal'
import { PlanActivityModal } from './PlanActivityModal'

interface PlanMonthViewProps {
  activities: PlannedActivity[]
  camps: TrainingCamp[]
  restDays: PlannedRestDay[]
  month: number
  year: number
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getSportColor(sportType: string): string {
  const key = PLANNED_SPORT_COLOR_KEY[sportType] ?? 'Other'
  return SPORT_COLORS[key] ?? SPORT_COLORS.Other
}

function formatDur(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

interface ActivityModalState {
  mode: 'add' | 'edit'
  date: string
  activity?: PlannedActivity
}

interface CampModalState {
  mode: 'add' | 'edit'
  camp?: TrainingCamp
  defaultStart?: string
}

export function PlanMonthView({ activities, camps, restDays, month, year }: PlanMonthViewProps) {
  const router = useRouter()
  const [activityModal, setActivityModal] = useState<ActivityModalState | null>(null)
  const [campModal, setCampModal] = useState<CampModalState | null>(null)
  const [restDaySet, setRestDaySet] = useState<Set<string>>(new Set(restDays.map((r) => r.date)))

  async function toggleRestDay(dateStr: string) {
    const isRest = restDaySet.has(dateStr)
    setRestDaySet((prev) => {
      const next = new Set(prev)
      if (isRest) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
    try {
      if (isRest) {
        await fetch(`/api/planned-rest-days/${dateStr}`, { method: 'DELETE' })
      } else {
        await fetch('/api/planned-rest-days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr }),
        })
      }
    } catch {
      setRestDaySet((prev) => {
        const next = new Set(prev)
        if (isRest) next.add(dateStr)
        else next.delete(dateStr)
        return next
      })
    }
  }

  // Build date → activities map
  const activityMap = new Map<string, PlannedActivity[]>()
  for (const a of activities) {
    const existing = activityMap.get(a.date) ?? []
    activityMap.set(a.date, [...existing, a])
  }

  // Build the 6-week calendar grid (Mon–Sun)
  const firstOfMonth = new Date(year, month - 1, 1)
  const firstMonday = new Date(firstOfMonth)
  const dow = (firstMonday.getDay() + 6) % 7
  firstMonday.setDate(firstMonday.getDate() - dow)

  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(firstMonday)
    d.setDate(firstMonday.getDate() + i)
    cells.push(d)
  }

  const todayStr = toDateStr(new Date())

  // Find camps overlapping a date
  function campsForDate(dateStr: string): TrainingCamp[] {
    return camps.filter((c) => c.start_date <= dateStr && c.end_date >= dateStr)
  }

  // Navigate to prev/next month
  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    router.push(`/plan?view=month&month=${d.getMonth() + 1}&year=${d.getFullYear()}`)
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    router.push(`/plan?view=month&month=${d.getMonth() + 1}&year=${d.getFullYear()}`)
  }

  // Current week for Week tab
  const now = new Date()
  const { week: nowWeek, year: nowYear } = getISOWeek(now)

  function handleActivitySaved() {
    setActivityModal(null)
    router.refresh()
  }
  function handleCampSaved() {
    setCampModal(null)
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Plan</h1>
          {/* View tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => router.push(`/plan?view=season&year=${getSeasonYear(firstOfMonth)}`)}
              className="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
            >
              Season
            </button>
            <span className="px-3 py-1.5 rounded-md bg-white shadow-sm font-semibold text-gray-900">Month</span>
            <button
              onClick={() => router.push(`/plan?view=week&week=${nowWeek}&year=${nowYear}`)}
              className="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
            >
              Week
            </button>
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

          {/* Month navigator */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const dateStr = toDateStr(day)
          const inMonth = day.getMonth() === month - 1
          const dayActivities = inMonth ? (activityMap.get(dateStr) ?? []) : []
          const isRest = inMonth && restDaySet.has(dateStr)
          const isToday = dateStr === todayStr
          const dayCamps = inMonth ? campsForDate(dateStr) : []
          const competitions = dayActivities.filter((a) => a.intensity_type === 'competition')
          const others = dayActivities.filter((a) => a.intensity_type !== 'competition')

          // Navigate to week when clicking the day number area
          const { week, year: weekYear } = getISOWeek(day)

          return (
            <div
              key={dateStr}
              onClick={() => { if (inMonth) setActivityModal({ mode: 'add', date: dateStr }) }}
              className={`rounded-lg p-1.5 min-h-[90px] flex flex-col border transition-colors ${
                inMonth ? 'cursor-pointer' : ''
              } ${
                !inMonth
                  ? 'bg-gray-50 border-gray-100'
                  : dayCamps.length > 0
                  ? 'bg-blue-50 border-blue-100 hover:bg-blue-100'
                  : isRest
                  ? 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
            >
              {/* Day number */}
              <div className="flex items-start justify-between mb-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (inMonth) router.push(`/plan?view=week&week=${week}&year=${weekYear}`)
                  }}
                  className={`text-xs font-semibold leading-none w-fit ${
                    !inMonth
                      ? 'text-gray-200 cursor-default'
                      : isToday
                      ? 'text-blue-600 underline'
                      : 'text-gray-700 hover:text-blue-500'
                  }`}
                  disabled={!inMonth}
                >
                  {day.getDate()}
                </button>
                {isRest && (
                  <span className="text-[9px] text-gray-300">🌙</span>
                )}
              </div>

              {inMonth && (
                <div className="flex-1 flex flex-col gap-0.5">
                  {/* Competitions first, prominent */}
                  {competitions.map((a) => (
                    <button
                      key={a.id}
                      onClick={(e) => { e.stopPropagation(); setActivityModal({ mode: 'edit', date: dateStr, activity: a }) }}
                      className="w-full text-left"
                    >
                      <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-white truncate">
                        ★ <span className="truncate">{a.sport_type}</span>
                      </span>
                    </button>
                  ))}

                  {/* Other activities */}
                  {others.map((a) => {
                    const color = a.intensity_type === 'interval' ? '#ef4444' : getSportColor(a.sport_type)
                    return (
                      <button
                        key={a.id}
                        onClick={(e) => { e.stopPropagation(); setActivityModal({ mode: 'edit', date: dateStr, activity: a }) }}
                        className="w-full text-left"
                      >
                        <span
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium truncate"
                          style={{ backgroundColor: `${color}25`, color }}
                        >
                          <span className="truncate">{a.sport_type}</span>
                          <span className="ml-auto shrink-0 opacity-70">{formatDur(a.duration_minutes)}</span>
                        </span>
                      </button>
                    )
                  })}

                  {/* Camp pill (only on the camp's first day in this month view) */}
                  {dayCamps.map((camp) => {
                    const isFirstDay = camp.start_date === dateStr || dateStr === toDateStr(new Date(year, month - 1, 1))
                    if (!isFirstDay) return null
                    return (
                      <button
                        key={camp.id}
                        onClick={(e) => { e.stopPropagation(); setCampModal({ mode: 'edit', camp }) }}
                        className="mt-auto text-[9px] font-medium text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full text-left truncate hover:bg-blue-200 transition-colors"
                      >
                        {camp.name}
                      </button>
                    )
                  })}

                  {/* Rest day badge */}
                  {isRest && (
                    <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full mt-auto self-start">
                      Rest
                    </span>
                  )}
                </div>
              )}

            </div>
          )
        })}
      </div>

      {activityModal && (
        <PlanActivityModal
          mode={activityModal.mode}
          date={activityModal.date}
          activity={activityModal.activity}
          initialTimeOfDay="morning"
          onClose={() => setActivityModal(null)}
          onSaved={handleActivitySaved}
          initialIsRestDay={activityModal.mode === 'add' ? restDaySet.has(activityModal.date) : undefined}
          onToggleRestDay={activityModal.mode === 'add' ? async (isRest: boolean) => {
            if (isRest) {
              await fetch('/api/planned-rest-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: activityModal.date }),
              })
              setRestDaySet((prev) => { const next = new Set(prev); next.add(activityModal.date); return next })
            } else {
              await fetch(`/api/planned-rest-days/${activityModal.date}`, { method: 'DELETE' })
              setRestDaySet((prev) => { const next = new Set(prev); next.delete(activityModal.date); return next })
            }
            setActivityModal(null)
          } : undefined}
        />
      )}

      {campModal && (
        <CampModal
          mode={campModal.mode}
          camp={campModal.camp}
          defaultStartDate={campModal.defaultStart}
          onClose={() => setCampModal(null)}
          onSaved={handleCampSaved}
        />
      )}
    </>
  )
}
