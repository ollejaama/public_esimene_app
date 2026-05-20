'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlannedActivity, TrainingCamp, PlannedRestDay } from '@/lib/supabase/types'
import { WeekNavigator } from '@/components/ui/WeekNavigator'
import { PlanActivityModal } from './PlanActivityModal'
import { CampModal } from './CampModal'
import { SPORT_COLORS, PLANNED_SPORT_COLOR_KEY } from '@/lib/constants'
import { toDateStr, getSeasonYear, fmtDateDisplay } from '@/lib/planUtils'
import { getISOWeek } from '@/lib/analytics/weekSummary'

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

function fmtMins(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`
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

  const activityMap = new Map<string, PlannedActivity[]>()
  for (const a of plannedActivities) {
    const existing = activityMap.get(a.date) ?? []
    activityMap.set(a.date, [...existing, a])
  }

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
      setRestDaySet((prev) => {
        const next = new Set(prev)
        if (isRest) next.add(dateKey)
        else next.delete(dateKey)
        return next
      })
    }
  }

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekEndStr = toDateStr(weekEnd)
  const weekStartStr = toDateStr(weekStart)
  const overlappingCamps = camps.filter((c) => c.start_date <= weekEndStr && c.end_date >= weekStartStr)

  const totalMinutes = plannedActivities.reduce((sum, a) => sum + a.duration_minutes, 0)

  const now = new Date()
  const { week: nowWeek, year: nowYear } = getISOWeek(now)

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Chapter III · planning</p>
          <h1 className="font-serif text-[48px] tracking-[-0.03em] leading-[1.05] text-atlas-ink mt-1">
            Week {week}
          </h1>
          <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
            {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* View tabs */}
          <div className="flex gap-1.5">
            {[
              { label: 'Season', onClick: () => router.push(`/plan?view=season&year=${getSeasonYear(weekStart)}`) },
              { label: 'Month', onClick: () => router.push(`/plan?view=month&month=${weekStart.getMonth() + 1}&year=${weekStart.getFullYear()}`) },
              { label: 'Week', onClick: () => {} },
            ].map(({ label, onClick }) => {
              const active = label === 'Week'
              return (
                <button key={label} onClick={onClick}
                  className={`font-mono text-[10px] tracking-[0.12em] uppercase px-3 py-[5px] border transition-colors ${active ? 'bg-atlas-selected text-atlas-selectedFg border-atlas-selected' : 'bg-transparent text-atlas-ink border-atlas-rule hover:border-atlas-muted'}`}>
                  {label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <WeekNavigator week={week} year={year} basePath="/plan" />
            {totalMinutes > 0 ? (
              <span className="font-mono text-[10px] tracking-[0.1em] text-atlas-muted">{fmtMins(totalMinutes)} planned</span>
            ) : (
              <span className="font-mono text-[10px] text-atlas-faint">no sessions planned</span>
            )}
          </div>
          <button
            onClick={() => setCampModal({ mode: 'add' })}
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted border border-atlas-rule px-3 py-[5px] hover:border-atlas-muted hover:text-atlas-ink transition-colors"
          >
            + add camp
          </button>
        </div>
      </div>

      {/* Camp banner */}
      {overlappingCamps.length > 0 && (
        <div className="mb-4 flex items-center gap-2 border border-atlas-rule px-4 py-2.5 bg-atlas-panel">
          <span className="font-mono text-[10px] text-atlas-muted">⛺</span>
          <div className="flex flex-wrap gap-2">
            {overlappingCamps.map((camp) => (
              <button
                key={camp.id}
                onClick={() => setCampModal({ mode: 'edit', camp })}
                className="font-serif italic text-[13px] text-atlas-ink hover:text-atlas-accent transition-colors"
              >
                {camp.name}
                <span className="ml-1.5 font-mono text-[9px] not-italic text-atlas-faint">
                  {fmtDateDisplay(camp.start_date)} – {fmtDateDisplay(camp.end_date)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Week grid */}
      <div
        className="grid grid-cols-7 bg-atlas-panel"
        style={{ borderTop: '1.5px solid var(--atlas-ink)', borderLeft: '1px solid var(--atlas-rule)' }}
      >
        {days.map((day, i) => {
          const dateKey = toDateKey(day)
          const activities = activityMap.get(dateKey) ?? []
          const morning = activities.filter((a) => (a.time_of_day ?? 'morning') === 'morning')
          const evening = activities.filter((a) => a.time_of_day === 'evening')
          const isToday = toDateKey(new Date()) === dateKey
          const isRest = restDaySet.has(dateKey)
          const inCamp = camps.some((c) => c.start_date <= dateKey && c.end_date >= dateKey)
          const monthLabel = day.toLocaleString('en-GB', { month: 'short' }).toUpperCase()

          return (
            <div
              key={dateKey}
              className="border-r border-b border-atlas-rule"
              style={{
                minHeight: 360,
                padding: '14px 14px 18px',
                backgroundColor: isToday
                  ? 'rgba(138,46,46,0.05)'
                  : inCamp
                  ? 'rgba(58,125,74,0.05)'
                  : 'transparent',
              }}
            >
              {/* Day header */}
              <div className="pb-2 mb-3 border-b border-atlas-rule">
                <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-atlas-faint">{WEEKDAYS[i]}</p>
                <p className={`font-serif text-[32px] tracking-[-0.02em] leading-none mt-0.5 ${isToday ? 'italic text-atlas-accent' : 'text-atlas-ink'}`}>
                  {day.getDate()}
                </p>
                <p className="font-mono text-[9px] tracking-[0.1em] text-atlas-muted mt-0.5">{monthLabel}</p>
              </div>

              {/* Morning */}
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-1.5">☀ Morning</p>
              <div className="mb-3">
                {morning.length === 0 && (
                  <p className="font-serif italic text-[12px] text-atlas-faint mb-1.5">—</p>
                )}
                {morning.map((a) => <PlanPill key={a.id} a={a} onClick={() => setModal({ mode: 'edit', date: dateKey, activity: a, timeOfDay: 'morning' })} />)}
                <button
                  onClick={() => setModal({ mode: 'add', date: dateKey, timeOfDay: 'morning' })}
                  className="w-full font-mono text-[10px] tracking-[0.1em] text-atlas-faint border border-dashed border-atlas-rule hover:border-atlas-muted hover:text-atlas-muted transition-colors py-1 mt-0.5"
                >
                  + add
                </button>
              </div>

              {/* Evening */}
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-1.5">☽ Evening</p>
              <div className="mb-3">
                {evening.length === 0 && (
                  <p className="font-serif italic text-[12px] text-atlas-faint mb-1.5">—</p>
                )}
                {evening.map((a) => <PlanPill key={a.id} a={a} onClick={() => setModal({ mode: 'edit', date: dateKey, activity: a, timeOfDay: 'evening' })} />)}
                <button
                  onClick={() => setModal({ mode: 'add', date: dateKey, timeOfDay: 'evening' })}
                  className="w-full font-mono text-[10px] tracking-[0.1em] text-atlas-faint border border-dashed border-atlas-rule hover:border-atlas-muted hover:text-atlas-muted transition-colors py-1 mt-0.5"
                >
                  + add
                </button>
              </div>

              {/* Rest day toggle */}
              <div className="border-t border-atlas-rule mt-auto pt-2">
                <button
                  onClick={() => toggleRestDay(dateKey)}
                  className={`font-mono text-[9px] tracking-[0.1em] uppercase transition-colors ${isRest ? 'text-atlas-muted' : 'text-atlas-faint hover:text-atlas-muted'}`}
                >
                  {isRest ? '🌙 rest day' : '○ rest day'}
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

function PlanPill({ a, onClick }: { a: PlannedActivity; onClick: () => void }) {
  const isComp = a.intensity_type === 'competition'
  const isInterval = a.intensity_type === 'interval'
  const color = getSportColor(a.sport_type)
  const dur = fmtMins(a.duration_minutes)

  return (
    <button onClick={onClick} className="w-full text-left mb-1.5 hover:opacity-80 transition-opacity">
      <span
        className={`flex items-baseline justify-between border-l-2 leading-[1.2] ${
          isComp ? 'atlas-pill-competition border-l-[#b8860b]' : isInterval ? 'atlas-pill-interval border-l-atlas-accent' : ''
        }`}
        style={{
          padding: '5px 8px 6px',
          ...(!isComp && !isInterval ? { backgroundColor: `${color}1f`, borderLeftColor: color } : {}),
        }}
      >
        <span className={`font-serif italic text-[13px] ${isComp ? 'text-[#b8860b]' : isInterval ? 'text-atlas-accent' : ''}`}
          style={!isComp && !isInterval ? { color } : {}}>
          {isComp ? '★ Race' : a.sport_type}
        </span>
        <span className="font-mono text-[10px] text-atlas-muted ml-2 shrink-0">{dur}</span>
      </span>
      {a.description && (
        <p className="font-mono text-[10px] text-atlas-muted mt-0.5 pl-2 leading-tight">{a.description}</p>
      )}
    </button>
  )
}
