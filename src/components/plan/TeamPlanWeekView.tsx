'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TeamPlannedActivity, TeamPlannedRestDay, TeamTrainingCamp } from '@/lib/supabase/types'
import { WeekNavigator } from '@/components/ui/WeekNavigator'
import { PlanActivityModal } from './PlanActivityModal'
import { CampModal } from './CampModal'
import { SPORT_COLORS, PLANNED_SPORT_COLOR_KEY } from '@/lib/constants'
import { toDateStr, fmtDateDisplay } from '@/lib/planUtils'
import { getISOWeek } from '@/lib/analytics/weekSummary'
import { createAuthBrowserClient } from '@/lib/supabase/browser'

// Re-use PlannedActivity shape for modal compatibility
import { PlannedActivity, TrainingCamp } from '@/lib/supabase/types'

interface TeamPlanWeekViewProps {
  teamId: string
  teamName: string
  teamActivities: TeamPlannedActivity[]
  teamRestDays: TeamPlannedRestDay[]
  teamCamps: TeamTrainingCamp[]
  weekStart: Date
  week: number
  year: number
  editable?: boolean           // true for coach editing, false for athlete read-only
  basePath?: string            // navigation base (default /coach/team/[id]/plan)
  planView?: 'my' | 'team'     // shown in athlete plan page toggle
  hasMyPlan?: boolean          // whether to show My plan toggle (athlete only)
  athletePlanBasePath?: string // athlete's /plan path for toggle navigation
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
  activity?: PlannedActivity  // modal uses PlannedActivity shape; team activity is compatible
  timeOfDay: 'morning' | 'evening'
}

// Convert TeamPlannedActivity → PlannedActivity shape for modal compatibility
function toModalActivity(a: TeamPlannedActivity): PlannedActivity {
  return { ...a, user_id: '' }
}

export function TeamPlanWeekView({
  teamId,
  teamName,
  teamActivities: initialActivities,
  teamRestDays: initialRestDays,
  teamCamps: initialCamps,
  weekStart,
  week,
  year,
  editable = false,
  basePath,
  planView = 'team',
  hasMyPlan = false,
  athletePlanBasePath,
}: TeamPlanWeekViewProps) {
  const router = useRouter()
  const [activities, setActivities] = useState<TeamPlannedActivity[]>(initialActivities)
  const [restDaySet, setRestDaySet] = useState<Set<string>>(new Set(initialRestDays.map((r) => r.date)))
  const [camps, setCamps] = useState<TeamTrainingCamp[]>(initialCamps)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [campModal, setCampModal] = useState<{ mode: 'add' | 'edit'; camp?: TeamTrainingCamp } | null>(null)
  const [notifying, setNotifying] = useState(false)

  const activityMap = new Map<string, TeamPlannedActivity[]>()
  for (const a of activities) {
    const existing = activityMap.get(a.date) ?? []
    activityMap.set(a.date, [...existing, a])
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekEndStr = toDateStr(weekEnd)
  const weekStartStr = toDateStr(weekStart)

  // Supabase realtime subscription — all clients (coach + athletes) subscribe to changes
  const refresh = useCallback(() => router.refresh(), [router])

  useEffect(() => {
    const supabase = createAuthBrowserClient()
    const channel = supabase
      .channel(`team-plan-${teamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_planned_activities', filter: `team_id=eq.${teamId}` },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_planned_rest_days', filter: `team_id=eq.${teamId}` },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_training_camps', filter: `team_id=eq.${teamId}` },
        () => refresh()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [teamId, refresh])

  // Keep state in sync when server re-renders after router.refresh()
  useEffect(() => { setActivities(initialActivities) }, [initialActivities])
  useEffect(() => { setRestDaySet(new Set(initialRestDays.map((r) => r.date))) }, [initialRestDays])
  useEffect(() => { setCamps(initialCamps) }, [initialCamps])

  function handleSaved() {
    setModal(null)
    router.refresh()
  }

  function handleCampSaved() {
    setCampModal(null)
    router.refresh()
  }

  async function toggleRestDay(dateKey: string) {
    if (!editable) return
    const isRest = restDaySet.has(dateKey)
    setRestDaySet((prev) => {
      const next = new Set(prev)
      if (isRest) next.delete(dateKey)
      else next.add(dateKey)
      return next
    })
    try {
      if (isRest) {
        await fetch(`/api/team-plan/rest-days/${teamId}/${dateKey}`, { method: 'DELETE' })
      } else {
        await fetch('/api/team-plan/rest-days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId, date: dateKey }),
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

  async function handleNotify() {
    setNotifying(true)
    try {
      await fetch(`/api/team-plan/${teamId}/notify`, { method: 'POST' })
    } finally {
      setNotifying(false)
    }
  }

  const overlappingCamps = camps.filter((c) => c.start_date <= weekEndStr && c.end_date >= weekStartStr)
  const totalMinutes = activities.reduce((sum, a) => sum + a.duration_minutes, 0)
  const { week: nowWeek, year: nowYear } = getISOWeek(new Date())

  const navBase = basePath ?? `/coach/team/${teamId}/plan`

  // Build a camp compatible with CampModal (which expects TrainingCamp shape with user_id)
  function toCampModalShape(c: TeamTrainingCamp): TrainingCamp {
    return { ...c, user_id: '' }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            {editable ? 'Chapter III · team planning' : 'Chapter III · planning'}
          </p>
          <h1 className="font-serif text-[48px] tracking-[-0.03em] leading-[1.05] text-atlas-ink mt-1">
            Week {week}
          </h1>
          <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">
            {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
            {weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {/* Team plan indicator */}
          <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-atlas-muted mt-1.5">
            {editable ? `✎ Editing team plan · ${teamName}` : `Team plan · ${teamName}`}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Plan view toggle (athlete only) */}
          {hasMyPlan && athletePlanBasePath && (
            <div className="flex gap-1.5 mb-1">
              <button
                onClick={() => router.push(`${athletePlanBasePath}?planView=my&view=week&week=${week}&year=${year}`)}
                className="font-mono text-[10px] tracking-[0.12em] uppercase px-3 py-[5px] border transition-colors bg-transparent text-atlas-ink border-atlas-rule hover:border-atlas-muted"
              >
                My plan
              </button>
              <button
                className="font-mono text-[10px] tracking-[0.12em] uppercase px-3 py-[5px] border transition-colors bg-atlas-selected text-atlas-selectedFg border-atlas-selected"
              >
                Team plan
              </button>
            </div>
          )}

          {/* Week/Month/Season tabs */}
          <div className="flex gap-1.5">
            {[
              { label: 'Season', onClick: () => router.push(`${navBase}?view=season&year=${year}`) },
              { label: 'Month', onClick: () => router.push(`${navBase}?view=month&month=${weekStart.getMonth() + 1}&year=${weekStart.getFullYear()}`) },
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
            <WeekNavigator week={week} year={year} basePath={navBase} extraParams={hasMyPlan ? 'planView=team' : undefined} />
            {totalMinutes > 0 ? (
              <span className="font-mono text-[10px] tracking-[0.1em] text-atlas-muted">{fmtMins(totalMinutes)} planned</span>
            ) : (
              <span className="font-mono text-[10px] text-atlas-faint">no sessions planned</span>
            )}
          </div>

          {editable && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCampModal({ mode: 'add' })}
                className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted border border-atlas-rule px-3 py-[5px] hover:border-atlas-muted hover:text-atlas-ink transition-colors"
              >
                + add camp
              </button>
              <button
                onClick={handleNotify}
                disabled={notifying}
                className="font-mono text-[10px] tracking-[0.1em] uppercase border border-atlas-ink text-atlas-ink px-3 py-[5px] hover:bg-atlas-ink hover:text-atlas-bg transition-colors disabled:opacity-40"
              >
                {notifying ? 'Sending…' : 'Notify athletes'}
              </button>
            </div>
          )}
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
                onClick={() => editable ? setCampModal({ mode: 'edit', camp }) : undefined}
                className={`font-serif italic text-[13px] text-atlas-ink ${editable ? 'hover:text-atlas-accent transition-colors' : ''}`}
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
          const dayActivities = activityMap.get(dateKey) ?? []
          const morning = dayActivities.filter((a) => (a.time_of_day ?? 'morning') === 'morning')
          const evening = dayActivities.filter((a) => a.time_of_day === 'evening')
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
                {morning.map((a) =>
                  editable ? (
                    <TeamPlanPill
                      key={a.id}
                      a={a}
                      onClick={() => setModal({ mode: 'edit', date: dateKey, activity: toModalActivity(a), timeOfDay: 'morning' })}
                    />
                  ) : (
                    <TeamPlanPill key={a.id} a={a} />
                  )
                )}
                {editable && (
                  <button
                    onClick={() => setModal({ mode: 'add', date: dateKey, timeOfDay: 'morning' })}
                    className="w-full font-mono text-[10px] tracking-[0.1em] text-atlas-faint border border-dashed border-atlas-rule hover:border-atlas-muted hover:text-atlas-muted transition-colors py-1 mt-0.5"
                  >
                    + add
                  </button>
                )}
              </div>

              {/* Evening */}
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-1.5">☽ Evening</p>
              <div className="mb-3">
                {evening.length === 0 && (
                  <p className="font-serif italic text-[12px] text-atlas-faint mb-1.5">—</p>
                )}
                {evening.map((a) =>
                  editable ? (
                    <TeamPlanPill
                      key={a.id}
                      a={a}
                      onClick={() => setModal({ mode: 'edit', date: dateKey, activity: toModalActivity(a), timeOfDay: 'evening' })}
                    />
                  ) : (
                    <TeamPlanPill key={a.id} a={a} />
                  )
                )}
                {editable && (
                  <button
                    onClick={() => setModal({ mode: 'add', date: dateKey, timeOfDay: 'evening' })}
                    className="w-full font-mono text-[10px] tracking-[0.1em] text-atlas-faint border border-dashed border-atlas-rule hover:border-atlas-muted hover:text-atlas-muted transition-colors py-1 mt-0.5"
                  >
                    + add
                  </button>
                )}
              </div>

              {/* Rest day */}
              <div className="border-t border-atlas-rule mt-auto pt-2">
                {editable ? (
                  <button
                    onClick={() => toggleRestDay(dateKey)}
                    className={`font-mono text-[9px] tracking-[0.1em] uppercase transition-colors ${isRest ? 'text-atlas-muted' : 'text-atlas-faint hover:text-atlas-muted'}`}
                  >
                    {isRest ? '🌙 rest day' : '○ rest day'}
                  </button>
                ) : (
                  isRest && (
                    <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-atlas-muted">🌙 rest day</span>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>

      {modal && editable && (
        <PlanActivityModal
          mode={modal.mode}
          date={modal.date}
          activity={modal.activity}
          initialTimeOfDay={modal.timeOfDay}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          apiBase="/api/team-plan/activities"
          extraBody={{ teamId }}
        />
      )}

      {campModal && editable && (
        <CampModal
          mode={campModal.mode}
          camp={campModal.camp ? toCampModalShape(campModal.camp) : undefined}
          defaultStartDate={weekStartStr}
          onClose={() => setCampModal(null)}
          onSaved={handleCampSaved}
          apiBase="/api/team-plan/camps"
          extraBody={{ teamId }}
        />
      )}
    </>
  )
}

function TeamPlanPill({ a, onClick }: { a: TeamPlannedActivity; onClick?: () => void }) {
  const isComp = a.intensity_type === 'competition'
  const isInterval = a.intensity_type === 'interval'
  const color = getSportColor(a.sport_type)
  const dur = fmtMins(a.duration_minutes)

  const inner = (
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
  )

  return (
    <div className={`w-full text-left mb-1.5 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}>
      {inner}
      {a.description && (
        <p className="font-mono text-[10px] text-atlas-muted mt-0.5 pl-2 leading-tight">{a.description}</p>
      )}
    </div>
  )
}
