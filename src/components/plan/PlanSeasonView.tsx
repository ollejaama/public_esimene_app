'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlannedActivity, TrainingCamp, PlannedRestDay } from '@/lib/supabase/types'
import { getISOWeek } from '@/lib/analytics/weekSummary'
import { toDateStr, seasonLabel, getSeasonYear } from '@/lib/planUtils'
import { CampModal } from './CampModal'

interface PlanSeasonViewProps {
  activities: PlannedActivity[]
  camps: TrainingCamp[]
  restDays: PlannedRestDay[]
  seasonYear: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getSeasonMonths(seasonYear: number): { year: number; month: number }[] {
  const months = []
  for (let m = 4; m <= 11; m++) months.push({ year: seasonYear, month: m })
  for (let m = 0; m <= 3; m++) months.push({ year: seasonYear + 1, month: m })
  return months
}

function getMonthCells(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const firstMonday = new Date(first)
  const dow = (firstMonday.getDay() + 6) % 7
  firstMonday.setDate(firstMonday.getDate() - dow)
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(firstMonday)
    d.setDate(firstMonday.getDate() + i)
    cells.push(d)
  }
  return cells
}

interface CampModalState {
  mode: 'add' | 'edit'
  camp?: TrainingCamp
}

export function PlanSeasonView({ activities, camps, restDays, seasonYear }: PlanSeasonViewProps) {
  const router = useRouter()
  const [campModal, setCampModal] = useState<CampModalState | null>(null)

  const restDaySet = new Set(restDays.map((r) => r.date))

  const activityMap = new Map<string, PlannedActivity[]>()
  for (const a of activities) {
    const existing = activityMap.get(a.date) ?? []
    activityMap.set(a.date, [...existing, a])
  }

  function campsForDate(dateStr: string): TrainingCamp[] {
    return camps.filter((c) => c.start_date <= dateStr && c.end_date >= dateStr)
  }

  const months = getSeasonMonths(seasonYear)
  const todayStr = toDateStr(new Date())

  const now = new Date()
  const { week: nowWeek, year: nowYear } = getISOWeek(now)

  function handleSaved() {
    setCampModal(null)
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Plan</h1>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs">
            <span className="px-3 py-1.5 rounded-md bg-white shadow-sm font-semibold text-gray-900">Season</span>
            <button
              onClick={() => router.push(`/plan?view=month&month=5&year=${seasonYear}`)}
              className="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
            >
              Month
            </button>
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/plan?view=season&year=${seasonYear - 1}`)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
              {seasonLabel(seasonYear)}
            </span>
            <button
              onClick={() => router.push(`/plan?view=season&year=${seasonYear + 1}`)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Camp legend (if any camps) */}
      {camps.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {camps.map((camp) => (
            <button
              key={camp.id}
              onClick={() => setCampModal({ mode: 'edit', camp })}
              className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              ⛺ {camp.name}
            </button>
          ))}
        </div>
      )}

      {/* 4 × 3 month dot grid */}
      <div className="grid grid-cols-4 gap-x-6 gap-y-8">
        {months.map(({ year, month }) => {
          const cells = getMonthCells(year, month)

          return (
            <div key={`${year}-${month}`}>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">
                {MONTH_NAMES[month]} {year}
              </p>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 mb-0.5">
                {DAY_INITIALS.map((d, i) => (
                  <div key={i} className="text-center text-[8px] text-gray-300 font-medium leading-none pb-0.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day dots */}
              <div className="grid grid-cols-7 gap-px">
                {cells.map((day) => {
                  const dateStr = toDateStr(day)
                  const inMonth = day.getMonth() === month
                  const isToday = dateStr === todayStr

                  if (!inMonth) {
                    return <div key={dateStr} className="w-full aspect-square" />
                  }

                  const dayCamps = campsForDate(dateStr)
                  const dayActivities = activityMap.get(dateStr) ?? []
                  const isRest = restDaySet.has(dateStr)
                  const hasComp = dayActivities.some((a) => a.intensity_type === 'competition')
                  const hasActivities = dayActivities.length > 0
                  const inCamp = dayCamps.length > 0
                  const { week, year: weekYear } = getISOWeek(day)

                  return (
                    <button
                      key={dateStr}
                      onClick={() => router.push(`/plan?view=week&week=${week}&year=${weekYear}`)}
                      title={dateStr}
                      className={`w-full aspect-square flex items-center justify-center rounded-sm transition-opacity hover:opacity-70 ${
                        inCamp ? 'bg-blue-50' : ''
                      } ${isToday ? 'ring-1 ring-blue-400 rounded' : ''}`}
                    >
                      {hasComp ? (
                        <span className="text-amber-400 leading-none" style={{ fontSize: '60%' }}>★</span>
                      ) : hasActivities ? (
                        <span className={`w-2 h-2 rounded-full block ${inCamp ? 'bg-blue-400' : 'bg-gray-400'}`} />
                      ) : isRest ? (
                        <span className="w-1.5 h-1.5 rounded-full block border border-gray-300" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full block bg-gray-100" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {campModal && (
        <CampModal
          mode={campModal.mode}
          camp={campModal.camp}
          onClose={() => setCampModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
