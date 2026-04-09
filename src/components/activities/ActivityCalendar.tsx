'use client'

import { useState } from 'react'
import { Activity } from '@/lib/supabase/types'
import { ActivityDayCell } from './ActivityDayCell'
import { ActivityModal } from './ActivityModal'

interface ActivityCalendarProps {
  activities: Activity[]
  initialMonth: Date
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

export function ActivityCalendar({ activities, initialMonth }: ActivityCalendarProps) {
  const [month, setMonth] = useState(initialMonth)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

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
            />
          ))}
        </div>
      </div>

      <ActivityModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </>
  )
}
