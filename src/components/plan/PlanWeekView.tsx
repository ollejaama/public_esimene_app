'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createAuthBrowserClient } from '@/lib/supabase/browser'
import { PlannedActivity, TrainingCamp, PlannedRestDay, TeamPlannedActivity, TeamTrainingCamp, TeamPlannedRestDay } from '@/lib/supabase/types'
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
  // Team plan data shown alongside personal (My plan view)
  teamActivities?: TeamPlannedActivity[]
  teamRestDays?: TeamPlannedRestDay[]
  teamCamps?: TeamTrainingCamp[]
  // Whether athlete is in a team (shows My plan / Team plan toggle)
  hasTeam?: boolean
  // Custom API bases for coach editing an athlete's plan
  activityApiBase?: string
  restDayApiBase?: string
  campApiBase?: string
  // Label shown below the date range (e.g. "Editing [athlete]'s plan")
  editingLabel?: string
  // When set, subscribe to realtime changes for this user's planned_activities
  realtimeUserId?: string
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

export function PlanWeekView({
  plannedActivities,
  camps,
  restDays,
  weekStart,
  week,
  year,
  teamActivities = [],
  teamRestDays = [],
  teamCamps = [],
  hasTeam = false,
  activityApiBase = '/api/planned-activities',
  restDayApiBase = '/api/planned-rest-days',
  campApiBase = '/api/training-camps',
  editingLabel,
  realtimeUserId,
}: PlanWeekViewProps) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalState | null>(null)
  const [campModal, setCampModal] = useState<{ mode: 'add' | 'edit'; camp?: TrainingCamp } | null>(null)
  const [restDaySet, setRestDaySet] = useState<Set<string>>(new Set(restDays.map((r) => r.date)))

  const activityMap = new Map<string, PlannedActivity[]>()
  for (const a of plannedActivities) {
    const existing = activityMap.get(a.date) ?? []
    activityMap.set(a.date, [...existing, a])
  }

  // Realtime: subscribe to personal planned_activities changes (coach edits → athlete sees)
  const realtimeRefresh = useCallback(() => router.refresh(), [router])
  useEffect(() => {
    if (!realtimeUserId) return
    const supabase = createAuthBrowserClient()
    const channel = supabase
      .channel(`personal-plan-${realtimeUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'planned_activities', filter: `user_id=eq.${realtimeUserId}` },
        () => realtimeRefresh()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [realtimeUserId, realtimeRefresh])

  const teamActivityMap = new Map<string, TeamPlannedActivity[]>()
  for (const a of teamActivities) {
    const existing = teamActivityMap.get(a.date) ?? []
    teamActivityMap.set(a.date, [...existing, a])
  }
  const teamRestDaySet = new Set(teamRestDays.map((r) => r.date))

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
        await fetch(`${restDayApiBase}/${dateKey}`, { method: 'DELETE' })
      } else {
        await fetch(restDayApiBase, {
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
  const overlappingTeamCamps = teamCamps.filter((c) => c.start_date <= weekEndStr && c.end_date >= weekStartStr)

  const totalMinutes = plannedActivities.reduce((sum, a) => sum + a.duration_minutes, 0)
  const { week: nowWeek, year: nowYear } = getISOWeek(new Date())

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
            {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
            {weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {editingLabel && (
            <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-atlas-muted mt-1.5">{editingLabel}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* My plan / Team plan toggle (athlete only, when in a team) */}
          {hasTeam && (
            <div className="flex gap-1.5 mb-1">
              <button className="font-mono text-[10px] tracking-[0.12em] uppercase px-3 py-[5px] border transition-colors bg-atlas-selected text-atlas-selectedFg border-atlas-selected">
                My plan
              </button>
              <button
                onClick={() => router.push(`/plan?planView=team&view=week&week=${week}&year=${year}`)}
                className="font-mono text-[10px] tracking-[0.12em] uppercase px-3 py-[5px] border transition-colors bg-transparent text-atlas-ink border-atlas-rule hover:border-atlas-muted"
              >
                Team plan
              </button>
            </div>
          )}

          {/* Season / Month / Week tabs */}
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

      {/* Personal camp banner */}
      {overlappingCamps.length > 0 && (
        <div className="mb-2 flex items-center gap-2 border border-atlas-rule px-4 py-2.5 bg-atlas-panel">
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

      {/* Team camp banner (read-only) */}
      {overlappingTeamCamps.length > 0 && (
        <div className="mb-4 flex items-center gap-2 border border-atlas-rule px-4 py-2.5 bg-atlas-panel opacity-70">
          <span className="font-mono text-[10px] text-atlas-muted">⛺</span>
          <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-atlas-faint mr-1">Team</span>
          <div className="flex flex-wrap gap-2">
            {overlappingTeamCamps.map((camp) => (
              <span key={camp.id} className="font-serif italic text-[13px] text-atlas-ink">
                {camp.name}
                <span className="ml-1.5 font-mono text-[9px] not-italic text-atlas-faint">
                  {fmtDateDisplay(camp.start_date)} – {fmtDateDisplay(camp.end_date)}
                </span>
              </span>
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
          const teamDayActivities = teamActivityMap.get(dateKey) ?? []
          const morning = activities.filter((a) => (a.time_of_day ?? 'morning') === 'morning')
          const evening = activities.filter((a) => a.time_of_day === 'evening')
          const teamMorning = teamDayActivities.filter((a) => (a.time_of_day ?? 'morning') === 'morning')
          const teamEvening = teamDayActivities.filter((a) => a.time_of_day === 'evening')
          const isToday = toDateKey(new Date()) === dateKey
          const isRest = restDaySet.has(dateKey)
          const isTeamRest = teamRestDaySet.has(dateKey)
          const inCamp = camps.some((c) => c.start_date <= dateKey && c.end_date >= dateKey)
          const inTeamCamp = teamCamps.some((c) => c.start_date <= dateKey && c.end_date >= dateKey)
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
                  : (inCamp || inTeamCamp)
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
                {teamMorning.length === 0 && morning.length === 0 && (
                  <p className="font-serif italic text-[12px] text-atlas-faint mb-1.5">—</p>
                )}
                {/* Team activities (read-only) */}
                {teamMorning.map((a) => <TeamPill key={`team-${a.id}`} a={a} />)}
                {/* Personal activities */}
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
                {teamEvening.length === 0 && evening.length === 0 && (
                  <p className="font-serif italic text-[12px] text-atlas-faint mb-1.5">—</p>
                )}
                {teamEvening.map((a) => <TeamPill key={`team-${a.id}`} a={a} />)}
                {evening.map((a) => <PlanPill key={a.id} a={a} onClick={() => setModal({ mode: 'edit', date: dateKey, activity: a, timeOfDay: 'evening' })} />)}
                <button
                  onClick={() => setModal({ mode: 'add', date: dateKey, timeOfDay: 'evening' })}
                  className="w-full font-mono text-[10px] tracking-[0.1em] text-atlas-faint border border-dashed border-atlas-rule hover:border-atlas-muted hover:text-atlas-muted transition-colors py-1 mt-0.5"
                >
                  + add
                </button>
              </div>

              {/* Rest day toggle */}
              <div className="border-t border-atlas-rule mt-auto pt-2 flex items-center gap-2">
                <button
                  onClick={() => toggleRestDay(dateKey)}
                  className={`font-mono text-[9px] tracking-[0.1em] uppercase transition-colors ${isRest ? 'text-atlas-muted' : 'text-atlas-faint hover:text-atlas-muted'}`}
                >
                  {isRest ? '🌙 rest day' : '○ rest day'}
                </button>
                {isTeamRest && !isRest && (
                  <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-atlas-faint">(team rest)</span>
                )}
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
          apiBase={activityApiBase}
        />
      )}

      {campModal && (
        <CampModal
          mode={campModal.mode}
          camp={campModal.camp}
          defaultStartDate={weekStartStr}
          onClose={() => setCampModal(null)}
          onSaved={handleCampSaved}
          apiBase={campApiBase}
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

function TeamPill({ a }: { a: TeamPlannedActivity }) {
  const isComp = a.intensity_type === 'competition'
  const isInterval = a.intensity_type === 'interval'
  const color = getSportColor(a.sport_type)
  const dur = fmtMins(a.duration_minutes)

  return (
    <div className="w-full text-left mb-1.5 opacity-70">
      <span
        className={`flex items-baseline justify-between border-l-2 leading-[1.2] border-dashed ${
          isComp ? 'border-l-[#b8860b]' : isInterval ? 'border-l-atlas-accent' : ''
        }`}
        style={{
          padding: '5px 8px 6px',
          ...(!isComp && !isInterval ? { backgroundColor: `${color}14`, borderLeftColor: color } : {}),
        }}
      >
        <span className="flex items-baseline gap-1.5">
          <span className={`font-serif italic text-[13px] ${isComp ? 'text-[#b8860b]' : isInterval ? 'text-atlas-accent' : ''}`}
            style={!isComp && !isInterval ? { color } : {}}>
            {isComp ? '★ Race' : a.sport_type}
          </span>
          <span className="font-mono text-[7px] tracking-[0.1em] uppercase text-atlas-faint">team</span>
        </span>
        <span className="font-mono text-[10px] text-atlas-muted ml-2 shrink-0">{dur}</span>
      </span>
      {a.description && (
        <p className="font-mono text-[10px] text-atlas-muted mt-0.5 pl-2 leading-tight">{a.description}</p>
      )}
    </div>
  )
}
