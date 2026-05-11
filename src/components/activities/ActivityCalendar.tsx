'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity } from '@/lib/supabase/types'
import { ActivityDayCell } from './ActivityDayCell'
import { ActivityModal } from './ActivityModal'
import { DayViewModal } from './DayViewModal'
import { ManualActivityModal } from './ManualActivityModal'
import { Modal } from '@/components/ui/Modal'
import { getISOWeek } from '@/lib/analytics/weekSummary'

interface ActivityCalendarProps {
  activities: Activity[]
  initialMonth: Date
  restDayThresholdMinutes?: number
  isCoach?: boolean
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Fill from Monday of the first week
  const startDow = (firstDay.getDay() + 6) % 7  // 0=Mon
  for (let i = startDow; i > 0; i--) {
    const d = new Date(firstDay)
    d.setDate(firstDay.getDate() - i)
    days.push(d)
  }
  // All days in month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  // Fill to end of last week
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDay)
      d.setDate(lastDay.getDate() + i)
      days.push(d)
    }
  }
  return days
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function ActivityCalendar({ activities, initialMonth, restDayThresholdMinutes = 0, isCoach = false }: ActivityCalendarProps) {
  const router = useRouter()
  const [month, setMonth] = useState(initialMonth)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<{ date: Date; activities: Activity[] } | null>(null)
  const [restDayPopup, setRestDayPopup] = useState<Date | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)

  function handleDayActivityClick(activity: Activity) {
    setSelectedDay(null)
    setSelectedActivityId(activity.id)
  }

  function handleDayClick(day: Date) {
    const dayActivities = activityMap.get(toDateKey(day)) ?? []
    if (dayActivities.length > 0) {
      setSelectedDay({ date: day, activities: dayActivities })
      return
    }
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    if (day <= todayEnd) {
      setRestDayPopup(day)
    } else {
      const { week, year } = getISOWeek(day)
      router.push(`/plan?week=${week}&year=${year}`)
    }
  }

  // Group activities by date key
  const activityMap = new Map<string, Activity[]>()
  for (const activity of activities) {
    const key = toDateKey(new Date(activity.start_date))
    const existing = activityMap.get(key) ?? []
    activityMap.set(key, [...existing, activity])
  }

  const days = getDaysInMonth(month.getFullYear(), month.getMonth())

  function navigate(dir: number) {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1))
  }

  const monthLabel = month.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
          <button onClick={() => navigate(1)} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {!isCoach && (
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-[#e5e5e5] hover:border-gray-400 rounded-md px-2.5 py-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add training
          </button>
        )}
      </div>

      <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#e5e5e5]">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-xs text-gray-400 text-center py-2 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => (
            <ActivityDayCell
              key={day.toISOString()}
              date={day}
              activities={activityMap.get(toDateKey(day)) ?? []}
              isCurrentMonth={day.getMonth() === month.getMonth()}
              onActivityClick={setSelectedActivityId}
              onDayClick={() => handleDayClick(day)}
              restDayThresholdMinutes={restDayThresholdMinutes}
            />
          ))}
        </div>
      </div>

      <ActivityModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
        isCoach={isCoach}
      />

      {selectedDay && (
        <DayViewModal
          date={selectedDay.date}
          activities={selectedDay.activities}
          onActivityClick={handleDayActivityClick}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {showManualModal && (
        <ManualActivityModal onClose={() => setShowManualModal(false)} />
      )}

      <Modal open={restDayPopup !== null} onClose={() => setRestDayPopup(null)} maxWidth="max-w-xs" align="center">
        {restDayPopup && (
          <div className="p-6 text-center">
            <p className="text-xs text-gray-400 mb-1">
              {restDayPopup.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-base font-semibold text-gray-500">Rest day</p>
          </div>
        )}
      </Modal>
    </>
  )
}
