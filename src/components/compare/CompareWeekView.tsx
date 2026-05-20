'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlannedActivity, Activity, IllnessLog, TrainingCamp, PlannedRestDay } from '@/lib/supabase/types'
import { fmtDateObj } from '@/lib/planUtils'
import { WeekNavigator } from '@/components/ui/WeekNavigator'
import { ActivityModal } from '@/components/activities/ActivityModal'
import { PlanActivityModal } from '@/components/plan/PlanActivityModal'
import { SPORT_COLORS, PLANNED_SPORT_COLOR_KEY, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { getActivityTitle, effectiveSportKey } from '@/lib/activity'

const ILLNESS_COLORS: Record<string, string> = {
  sick: '#a23b2a',
  injured: '#c8703a',
  fatigue: '#c6a24a',
}

interface CompareWeekViewProps {
  plannedActivities: PlannedActivity[]
  actualActivities: Activity[]
  weekStart: Date
  week: number
  year: number
  isCoach?: boolean
  illnessEntries?: IllnessLog[]
  camps?: TrainingCamp[]
  restDays?: PlannedRestDay[]
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDurationMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`
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
  camps = [],
  restDays = [],
}: CompareWeekViewProps) {
  const router = useRouter()
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [selectedPlanned, setSelectedPlanned] = useState<PlannedActivity | null>(null)
  const [selectedRestDayDate, setSelectedRestDayDate] = useState<string | null>(null)

  const restDaySet = new Set(restDays.map((r) => r.date))

  function handleActivitySaved() {
    setSelectedPlanned(null)
    router.refresh()
  }

  async function handleToggleRestDay(isRest: boolean) {
    const date = selectedRestDayDate
    if (!date) return
    if (!isRest) {
      await fetch(`/api/planned-rest-days/${date}`, { method: 'DELETE' })
    }
    setSelectedRestDayDate(null)
    router.refresh()
  }

  function campsForDate(dateStr: string): TrainingCamp[] {
    return camps.filter((c) => c.start_date <= dateStr && c.end_date >= dateStr)
  }

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

  const plannedTotalMinutes = plannedActivities.reduce((s, a) => s + a.duration_minutes, 0)
  const actualTotalMinutes = Math.round(
    actualActivities.filter((a) => !a.hidden).reduce((s, a) => s + (a.moving_time ?? a.elapsed_time), 0) / 60
  )

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Chapter IV · compare</p>
          <h1 className="font-serif text-[48px] tracking-[-0.03em] leading-[1.05] text-atlas-ink mt-1">
            Week {week}
          </h1>
          <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
            {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <WeekNavigator week={week} year={year} basePath="/compare" />
      </div>

      {/* Table */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: '100px 1fr 1fr',
          borderTop: '1.5px solid var(--atlas-ink)',
          borderLeft: '1px solid var(--atlas-rule)',
        }}
      >
        {/* Column header row */}
        <div className="border-r border-b border-atlas-rule bg-atlas-panel px-3 py-2.5" />
        <div className="border-r border-b border-atlas-rule bg-atlas-panel px-3 py-2.5">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            Planned{plannedTotalMinutes > 0 ? <span className="text-atlas-faint"> — {formatDurationMinutes(plannedTotalMinutes)}</span> : null}
          </p>
        </div>
        <div className="border-r border-b border-atlas-rule bg-atlas-panel px-3 py-2.5">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            Actual{actualTotalMinutes > 0 ? <span className="text-atlas-faint"> — {formatDurationMinutes(actualTotalMinutes)}</span> : null}
          </p>
        </div>

        {/* Day rows */}
        {days.map((day, i) => {
          const dateKey = toDateKey(day)
          const planned = plannedMap.get(dateKey) ?? []
          const actual = actualMap.get(dateKey) ?? []
          const isEmpty = planned.length === 0 && actual.length === 0
          const isToday = toDateKey(new Date()) === dateKey
          const dayIllness = illnessEntries.filter((e) => e.start_date <= dateKey && e.end_date >= dateKey)
          const isRestDay = restDaySet.has(dateKey)
          const hasConflict = isRestDay && actual.length > 0
          const dayCamps = campsForDate(dateKey)
          const inCamp = dayCamps.length > 0

          const cellBg = hasConflict
            ? 'rgba(198,162,74,0.08)'
            : inCamp
            ? 'rgba(58,125,74,0.05)'
            : isToday
            ? 'rgba(138,46,46,0.05)'
            : 'transparent'

          const rowOpacity = isEmpty && dayIllness.length === 0 ? 0.38 : 1

          return [
            /* Day label cell */
            <div
              key={`label-${dateKey}`}
              className="border-r border-b border-atlas-rule"
              style={{ padding: '12px 14px', backgroundColor: cellBg, opacity: rowOpacity }}
            >
              {inCamp && (
                <p className="font-mono text-[8px] tracking-[0.08em] uppercase mb-1" style={{ color: '#3a7d4a' }}>
                  ⛺ {dayCamps.map((c) => c.name).join(', ')}
                </p>
              )}
              <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-atlas-faint">{WEEKDAYS[i]}</p>
              <p className={`font-serif text-[28px] tracking-[-0.02em] leading-none mt-0.5 ${isToday ? 'italic text-atlas-accent' : 'text-atlas-ink'}`}>
                {day.getDate()}
              </p>
              <p className="font-mono text-[9px] tracking-[0.1em] text-atlas-muted mt-0.5">
                {MONTH_SHORT[day.getMonth()]}
              </p>
              {dayIllness.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-2">
                  {dayIllness.map((e) => (
                    <span
                      key={e.id}
                      className="font-mono text-[8px] tracking-[0.08em] uppercase leading-none px-1 py-0.5"
                      style={{ backgroundColor: `${ILLNESS_COLORS[e.category] ?? '#888'}22`, color: ILLNESS_COLORS[e.category] ?? '#888' }}
                    >
                      {e.category}
                    </span>
                  ))}
                </div>
              )}
              {hasConflict && (
                <span className="font-mono text-[8px] tracking-[0.05em] uppercase block mt-1" style={{ color: '#c6a24a' }}>
                  trained on rest
                </span>
              )}
            </div>,

            /* Planned cell */
            <div
              key={`planned-${dateKey}`}
              className="border-r border-b border-atlas-rule"
              style={{ padding: '12px 14px 14px', backgroundColor: cellBg, opacity: rowOpacity, minHeight: 72 }}
            >
              {isRestDay && (
                <button
                  onClick={() => setSelectedRestDayDate(dateKey)}
                  className="font-mono text-[9px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink transition-colors mb-1.5 block"
                >
                  🌙 rest day
                </button>
              )}
              {planned.length === 0 && !isRestDay ? (
                <span className="font-serif italic text-[12px] text-atlas-faint">—</span>
              ) : (
                <div className="space-y-1.5">
                  {planned.map((a) => {
                    const color = getPlannedColor(a.sport_type)
                    const isComp = a.intensity_type === 'competition'
                    const isInterval = a.intensity_type === 'interval'
                    return (
                      <button key={a.id} onClick={() => setSelectedPlanned(a)} className="w-full text-left hover:opacity-80 transition-opacity">
                        <span
                          className={`flex items-center border-l-2 leading-[1.2] ${isComp ? 'atlas-pill-competition border-l-[#b8860b]' : isInterval ? 'atlas-pill-interval border-l-atlas-accent' : ''}`}
                          style={{
                            padding: '3px 6px 4px',
                            ...(!isComp && !isInterval ? { backgroundColor: `${color}20`, borderLeftColor: color } : {}),
                          }}
                        >
                          <span
                            className={`font-serif italic text-[12px] truncate ${isComp ? 'text-[#b8860b]' : isInterval ? 'text-atlas-accent' : ''}`}
                            style={!isComp && !isInterval ? { color } : {}}
                          >
                            {isComp ? '★ Race' : a.sport_type}
                          </span>
                          <span
                            className="font-mono text-[9px] ml-auto shrink-0 pl-1"
                            style={{ color: isComp ? '#b8860b' : isInterval ? 'var(--atlas-muted)' : `${color}cc` }}
                          >
                            {formatDurationMinutes(a.duration_minutes)}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>,

            /* Actual cell */
            <div
              key={`actual-${dateKey}`}
              className="border-r border-b border-atlas-rule"
              style={{ padding: '12px 14px 14px', backgroundColor: cellBg, opacity: rowOpacity, minHeight: 72 }}
            >
              {actual.length === 0 ? (
                <span className="font-serif italic text-[12px] text-atlas-faint">—</span>
              ) : (
                <div className="space-y-1.5">
                  {actual.map((a) => {
                    const color = getActualColor(a)
                    const isComp = a.intensity_type === 'competition'
                    const isInterval = a.intensity_type === 'interval'
                    const hidden = !isCoach && a.hidden
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedActivityId(a.id)}
                        className={`w-full text-left hover:opacity-80 transition-opacity ${hidden ? 'opacity-40 grayscale' : ''}`}
                      >
                        <span
                          className={`flex items-center border-l-2 leading-[1.2] ${isComp ? 'atlas-pill-competition border-l-[#b8860b]' : isInterval ? 'atlas-pill-interval border-l-atlas-accent' : ''}`}
                          style={{
                            padding: '3px 6px 4px',
                            ...(!isComp && !isInterval ? { backgroundColor: `${color}20`, borderLeftColor: color } : {}),
                          }}
                        >
                          <span
                            className={`font-serif italic text-[12px] truncate ${isComp ? 'text-[#b8860b]' : isInterval ? 'text-atlas-accent' : ''}`}
                            style={!isComp && !isInterval ? { color } : {}}
                          >
                            {getActivityTitle(a)}
                          </span>
                          <span
                            className="font-mono text-[9px] ml-auto shrink-0 pl-1"
                            style={{ color: isComp ? '#b8860b' : isInterval ? 'var(--atlas-muted)' : `${color}cc` }}
                          >
                            {formatDurationSeconds(a.moving_time ?? a.elapsed_time)}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>,
          ]
        })}
      </div>

      <ActivityModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />

      {selectedPlanned && (
        <PlanActivityModal
          mode="edit"
          date={selectedPlanned.date}
          activity={selectedPlanned}
          initialTimeOfDay={selectedPlanned.time_of_day}
          onClose={() => setSelectedPlanned(null)}
          onSaved={handleActivitySaved}
        />
      )}

      {selectedRestDayDate && (
        <PlanActivityModal
          mode="add"
          date={selectedRestDayDate}
          initialIsRestDay={true}
          onToggleRestDay={handleToggleRestDay}
          onClose={() => setSelectedRestDayDate(null)}
          onSaved={() => setSelectedRestDayDate(null)}
        />
      )}
    </>
  )
}
