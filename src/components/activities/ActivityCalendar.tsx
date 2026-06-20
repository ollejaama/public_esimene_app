'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, IllnessLog } from '@/lib/supabase/types'
import { ActivityDayCell } from './ActivityDayCell'
import { ActivityPreviewModal } from './ActivityPreviewModal'
import { ActivityExpandedModal } from './ActivityExpandedModal'
import { DayViewModal } from './DayViewModal'
import { ManualActivityModal } from './ManualActivityModal'
import { getISOWeek } from '@/lib/analytics/weekSummary'
import { effectiveContributionSeconds } from '@/lib/activity'

interface UserSettings {
  show_rpe: boolean
  show_lactate: boolean
}

interface ActivityCalendarProps {
  activities: Activity[]
  initialMonth: Date
  restDayThresholdMinutes?: number
  isCoach?: boolean
  viewAsUserId?: string
  illnessEntries?: IllnessLog[]
  userSettings?: UserSettings
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  for (let i = startDow; i > 0; i--) {
    const d = new Date(firstDay)
    d.setDate(firstDay.getDate() - i)
    days.push(d)
  }
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
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

export function ActivityCalendar({
  activities, initialMonth, restDayThresholdMinutes = 0,
  isCoach = false, viewAsUserId, illnessEntries = [], userSettings,
}: ActivityCalendarProps) {
  const router = useRouter()
  const [month, setMonth] = useState(initialMonth)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<{ date: Date; activities: Activity[]; dateKey: string } | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)

  function handleDayActivityClick(activity: Activity) {
    setSelectedDay(null)
    setSelectedActivity(activity)
  }

  function handleDayClick(day: Date) {
    const dateKey = toDateKey(day)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    if (day <= todayEnd) {
      setSelectedDay({ date: day, activities: activityMap.get(dateKey) ?? [], dateKey })
    } else {
      const { week, year } = getISOWeek(day)
      router.push(`/plan?week=${week}&year=${year}`)
    }
  }

  const activityMap = new Map<string, Activity[]>()
  for (const activity of activities) {
    const key = toDateKey(new Date(activity.start_date))
    const existing = activityMap.get(key) ?? []
    activityMap.set(key, [...existing, activity].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    ))
  }

  const days = getDaysInMonth(month.getFullYear(), month.getMonth())

  function navigate(dir: number) {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1))
  }

  // Navigation labels
  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1)
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const prevLabel = prevMonth.toLocaleString('en-GB', { month: 'short' })
  const nextLabel = nextMonth.toLocaleString('en-GB', { month: 'short' })

  // Footer stats — current month through today (or end of month)
  const now = new Date()
  const isThisMonth = month.getMonth() === now.getMonth() && month.getFullYear() === now.getFullYear()
  const cutoff = isThisMonth ? now : new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const cutoffKey = toDateKey(cutoff)
  const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const lastDayNum = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  let footerSecs = 0, intervalDaysCount = 0, restDaysCount = 0
  for (let d = 1; d <= lastDayNum; d++) {
    const dayKey = `${monthStr}-${String(d).padStart(2, '0')}`
    if (dayKey > cutoffKey) break
    const dayActs = (activityMap.get(dayKey) ?? []).filter((a) => !a.hidden)
    const daySecs = dayActs.reduce((s, a) => s + effectiveContributionSeconds(a), 0)
    footerSecs += daySecs
    if (dayActs.some((a) => a.intensity_type === 'interval')) intervalDaysCount++
    const isRest = restDayThresholdMinutes === 0 ? daySecs === 0 : daySecs < restDayThresholdMinutes * 60
    if (isRest) restDaysCount++
  }
  const footerMins = Math.round(footerSecs / 60)
  const footerH = Math.floor(footerMins / 60)
  const footerM = footerMins % 60
  const throughDay = cutoff.getDate()
  const throughMonthName = cutoff.toLocaleString('en-GB', { month: 'long' })

  return (
    <>
      {/* Page header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            Chapter II · The month of
          </p>
          <h1 className="font-serif text-[56px] font-normal tracking-[-0.03em] leading-[1.05] mt-1.5 text-atlas-ink">
            {month.toLocaleString('en-GB', { month: 'long' })}
            <span className="italic text-atlas-accent"> {month.getFullYear()}</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2 pb-1">
          <div className="flex gap-1.5">
            <button
              onClick={() => navigate(-1)}
              className="border border-atlas-rule bg-transparent text-atlas-ink font-sans text-xs px-2.5 py-1 hover:border-atlas-muted transition-colors"
            >
              ← {prevLabel}
            </button>
            <button
              onClick={() => navigate(1)}
              className="border border-atlas-rule bg-transparent text-atlas-ink font-sans text-xs px-2.5 py-1 hover:border-atlas-muted transition-colors"
            >
              {nextLabel} →
            </button>
          </div>
          {!isCoach && (
            <button
              onClick={() => setShowManualModal(true)}
              className="bg-atlas-selected text-atlas-selectedFg font-mono text-[10px] tracking-[0.1em] uppercase px-[14px] py-[6px] hover:opacity-90 transition-opacity"
            >
              + Add training
            </button>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border-l border-atlas-rule" style={{ borderTop: '1.5px solid var(--atlas-ink)' }}>
        {/* Weekday header row */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted px-3 py-2.5 border-b border-r border-atlas-rule bg-atlas-panel"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateKey = toDateKey(day)
            const dayIllness = illnessEntries.filter((e) => e.start_date <= dateKey && e.end_date >= dateKey)
            return (
              <ActivityDayCell
                key={day.toISOString()}
                date={day}
                activities={activityMap.get(dateKey) ?? []}
                isCurrentMonth={day.getMonth() === month.getMonth()}
                onActivityClick={handleDayActivityClick}
                onDayClick={() => handleDayClick(day)}
                restDayThresholdMinutes={restDayThresholdMinutes}
                illnessEntries={dayIllness}
              />
            )
          })}
        </div>
      </div>

      {/* Footer marginalia */}
      <div className="mt-4 pt-3 border-t border-atlas-rule flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted">
          Through {throughDay} {throughMonthName}
        </span>
        <span className="font-serif italic text-sm text-atlas-muted">
          {footerH}h {String(footerM).padStart(2, '0')}m logged ·{' '}
          <span className="text-atlas-accent">{intervalDaysCount} interval {intervalDaysCount === 1 ? 'day' : 'days'}</span>
          {' '}· {restDaysCount} rest {restDaysCount === 1 ? 'day' : 'days'}
        </span>
      </div>

      {selectedActivity && !expandedActivityId && (
        <ActivityPreviewModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onExpand={() => {
            setExpandedActivityId(selectedActivity.id)
            setSelectedActivity(null)
          }}
          isCoach={isCoach}
          showFeeling={userSettings?.show_rpe ?? false}
          showLactate={userSettings?.show_lactate ?? false}
        />
      )}

      {expandedActivityId && (
        <ActivityExpandedModal
          activityId={expandedActivityId}
          onClose={() => setExpandedActivityId(null)}
          isCoach={isCoach}
          viewAsUserId={viewAsUserId}
          showFeeling={userSettings?.show_rpe ?? false}
          showLactate={userSettings?.show_lactate ?? false}
        />
      )}

      {selectedDay && (
        <DayViewModal
          date={selectedDay.date}
          activities={selectedDay.activities}
          onActivityClick={handleDayActivityClick}
          onClose={() => setSelectedDay(null)}
          illnessEntries={illnessEntries.filter((e) => e.start_date <= selectedDay.dateKey && e.end_date >= selectedDay.dateKey)}
          defaultDate={selectedDay.dateKey}
          isCoach={isCoach}
        />
      )}

      {showManualModal && (
        <ManualActivityModal onClose={() => setShowManualModal(false)} />
      )}
    </>
  )
}
