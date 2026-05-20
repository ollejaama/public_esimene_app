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
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getSportColor(sportType: string): string {
  const key = PLANNED_SPORT_COLOR_KEY[sportType] ?? 'Other'
  return SPORT_COLORS[key] ?? SPORT_COLORS.Other
}

function fmtMins(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`
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

  const activityMap = new Map<string, PlannedActivity[]>()
  for (const a of activities) {
    const existing = activityMap.get(a.date) ?? []
    activityMap.set(a.date, [...existing, a])
  }

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

  function campsForDate(dateStr: string): TrainingCamp[] {
    return camps.filter((c) => c.start_date <= dateStr && c.end_date >= dateStr)
  }

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    router.push(`/plan?view=month&month=${d.getMonth() + 1}&year=${d.getFullYear()}`)
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    router.push(`/plan?view=month&month=${d.getMonth() + 1}&year=${d.getFullYear()}`)
  }

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

  const prevMonthDate = new Date(year, month - 2, 1)
  const nextMonthDate = new Date(year, month, 1)

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Chapter III · planning</p>
          <h1 className="font-serif text-[56px] tracking-[-0.03em] leading-[1.05] text-atlas-ink mt-1.5">
            {MONTH_NAMES[month - 1]}<span className="italic text-atlas-accent"> {year}</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* View tabs */}
          <div className="flex gap-1.5">
            {[
              { label: 'Season', onClick: () => router.push(`/plan?view=season&year=${getSeasonYear(firstOfMonth)}`) },
              { label: 'Month', onClick: () => {} },
              { label: 'Week', onClick: () => router.push(`/plan?view=week&week=${nowWeek}&year=${nowYear}`) },
            ].map(({ label, onClick }) => {
              const active = label === 'Month'
              return (
                <button key={label} onClick={onClick}
                  className={`font-mono text-[10px] tracking-[0.12em] uppercase px-3 py-[5px] border transition-colors ${active ? 'bg-atlas-selected text-atlas-selectedFg border-atlas-selected' : 'bg-transparent text-atlas-ink border-atlas-rule hover:border-atlas-muted'}`}>
                  {label}
                </button>
              )
            })}
          </div>
          {/* Month nav */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="font-mono text-[11px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors">←</button>
            <span className="font-serif italic text-[13px] text-atlas-muted min-w-[90px] text-center">
              {MONTH_SHORT[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="font-mono text-[11px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors">→</button>
          </div>
          <button
            onClick={() => setCampModal({ mode: 'add' })}
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted border border-atlas-rule px-3 py-[5px] hover:border-atlas-muted hover:text-atlas-ink transition-colors"
          >
            + add camp
          </button>
        </div>
      </div>

      {/* Weekday headers + grid */}
      <div
        className="grid grid-cols-7"
        style={{ borderTop: '1.5px solid var(--atlas-ink)', borderLeft: '1px solid var(--atlas-rule)' }}
      >
        {DAY_LABELS.map((d) => (
          <div key={d} className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted bg-atlas-panel border-r border-b border-atlas-rule py-2.5 px-3">
            {d}
          </div>
        ))}

        {cells.map((day) => {
          const dateStr = toDateStr(day)
          const inMonth = day.getMonth() === month - 1
          const dayActivities = inMonth ? (activityMap.get(dateStr) ?? []) : []
          const isRest = inMonth && restDaySet.has(dateStr)
          const isToday = dateStr === todayStr
          const dayCamps = inMonth ? campsForDate(dateStr) : []
          const competitions = dayActivities.filter((a) => a.intensity_type === 'competition')
          const others = dayActivities.filter((a) => a.intensity_type !== 'competition')
          const { week, year: weekYear } = getISOWeek(day)

          return (
            <div
              key={dateStr}
              onClick={() => { if (inMonth) setActivityModal({ mode: 'add', date: dateStr }) }}
              className={`border-r border-b border-atlas-rule relative transition-colors ${inMonth ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.04)]' : 'opacity-[0.35]'} ${isToday ? 'atlas-today-bg' : ''}`}
              style={{
                minHeight: 102,
                padding: '8px 10px',
                ...(dayCamps.length > 0 && inMonth ? { backgroundColor: 'rgba(58,125,74,0.05)' } : {}),
              }}
            >
              {/* Date numeral */}
              <div className="flex items-baseline justify-between mb-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (inMonth) router.push(`/plan?view=week&week=${week}&year=${weekYear}`)
                  }}
                  className={`font-serif text-[18px] leading-none tracking-[-0.02em] ${isToday ? 'italic text-atlas-accent' : 'text-atlas-ink'}`}
                  disabled={!inMonth}
                >
                  {day.getDate()}
                </button>
              </div>

              {inMonth && (
                <div className="flex flex-col gap-[3px]">
                  {competitions.map((a) => (
                    <button key={a.id} onClick={(e) => { e.stopPropagation(); setActivityModal({ mode: 'edit', date: dateStr, activity: a }) }} className="w-full text-left hover:opacity-80 transition-opacity">
                      <span className="flex items-center atlas-pill-competition border-l-2 border-l-[#b8860b] leading-[1.2]" style={{ padding: '3px 6px 4px' }}>
                        <span className="font-mono text-[9px] text-[#b8860b] shrink-0 mr-1">★</span>
                        <span className="font-serif italic text-[12px] text-[#b8860b] truncate">Race</span>
                        <span className="font-mono text-[9px] ml-auto shrink-0 pl-1 text-[#b8860b]">{fmtMins(a.duration_minutes)}</span>
                      </span>
                    </button>
                  ))}

                  {others.map((a) => {
                    const isInterval = a.intensity_type === 'interval'
                    const color = getSportColor(a.sport_type)
                    return (
                      <button key={a.id} onClick={(e) => { e.stopPropagation(); setActivityModal({ mode: 'edit', date: dateStr, activity: a }) }} className="w-full text-left hover:opacity-80 transition-opacity">
                        <span
                          className={`flex items-center border-l-2 leading-[1.2] ${isInterval ? 'atlas-pill-interval border-atlas-accent' : ''}`}
                          style={{
                            padding: '3px 6px 4px',
                            ...(!isInterval ? { backgroundColor: `${color}20`, borderLeftColor: color } : {}),
                          }}
                        >
                          <span className="font-serif italic text-[12px] truncate"
                            style={{ color: isInterval ? 'var(--atlas-accent)' : color }}>
                            {a.sport_type}
                          </span>
                          <span className="font-mono text-[9px] ml-auto shrink-0 pl-1"
                            style={{ color: isInterval ? 'var(--atlas-muted)' : `${color}cc` }}>
                            {fmtMins(a.duration_minutes)}
                          </span>
                        </span>
                      </button>
                    )
                  })}

                  {dayCamps.map((camp) => {
                    const isFirstDay = camp.start_date === dateStr || dateStr === toDateStr(new Date(year, month - 1, 1))
                    if (!isFirstDay) return null
                    return (
                      <button key={camp.id} onClick={(e) => { e.stopPropagation(); setCampModal({ mode: 'edit', camp }) }}
                        className="font-mono text-[9px] tracking-[0.08em] uppercase text-left px-1.5 py-0.5 hover:opacity-80 transition-opacity"
                        style={{ color: '#3a7d4a', backgroundColor: 'rgba(58,125,74,0.12)' }}>
                        ⛺ {camp.name}
                      </button>
                    )
                  })}
                </div>
              )}

              {isRest && inMonth && dayActivities.length === 0 && (
                <span className="absolute bottom-2 left-[10px] font-serif italic text-[10px] text-atlas-faint">rest</span>
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
