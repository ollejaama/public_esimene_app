'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlannedActivity, TrainingCamp, PlannedRestDay } from '@/lib/supabase/types'
import { getISOWeek } from '@/lib/analytics/weekSummary'
import { toDateStr, seasonLabel } from '@/lib/planUtils'
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
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">Chapter III · planning</p>
          <h1 className="font-serif text-[56px] tracking-[-0.03em] leading-[1.05] text-atlas-ink mt-1.5">
            Season<span className="italic text-atlas-accent"> {seasonYear}/{String(seasonYear + 1).slice(-2)}</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* View tabs */}
          <div className="flex gap-1.5">
            {[
              { label: 'Season', onClick: () => {} },
              { label: 'Month', onClick: () => router.push(`/plan?view=month&month=5&year=${seasonYear}`) },
              { label: 'Week', onClick: () => router.push(`/plan?view=week&week=${nowWeek}&year=${nowYear}`) },
            ].map(({ label, onClick }) => {
              const active = label === 'Season'
              return (
                <button key={label} onClick={onClick}
                  className={`font-mono text-[10px] tracking-[0.12em] uppercase px-3 py-[5px] border transition-colors ${active ? 'bg-atlas-selected text-atlas-selectedFg border-atlas-selected' : 'bg-transparent text-atlas-ink border-atlas-rule hover:border-atlas-muted'}`}>
                  {label}
                </button>
              )
            })}
          </div>
          {/* Season nav */}
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/plan?view=season&year=${seasonYear - 1}`)}
              className="font-mono text-[11px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors">←</button>
            <span className="font-serif italic text-[13px] text-atlas-muted min-w-[60px] text-center">
              {seasonLabel(seasonYear)}
            </span>
            <button onClick={() => router.push(`/plan?view=season&year=${seasonYear + 1}`)}
              className="font-mono text-[11px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors">→</button>
          </div>
          <button
            onClick={() => setCampModal({ mode: 'add' })}
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted border border-atlas-rule px-3 py-[5px] hover:border-atlas-muted hover:text-atlas-ink transition-colors"
          >
            + add camp
          </button>
        </div>
      </div>

      {/* Camp legend */}
      {camps.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {camps.map((camp) => (
            <button
              key={camp.id}
              onClick={() => setCampModal({ mode: 'edit', camp })}
              className="font-mono text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 border border-atlas-rule hover:border-atlas-muted transition-colors"
              style={{ color: '#3a7d4a' }}
            >
              ⛺ {camp.name}
            </button>
          ))}
        </div>
      )}

      {/* 4 × 3 mini month grid */}
      <div className="grid grid-cols-4 gap-x-8 gap-y-8">
        {months.map(({ year, month }) => {
          const cells = getMonthCells(year, month)

          return (
            <div key={`${year}-${month}`}>
              <p className="font-serif text-[15px] tracking-[-0.01em] text-atlas-ink mb-1.5">
                {MONTH_NAMES[month]}<span className="font-mono text-[10px] text-atlas-faint ml-1.5">{year}</span>
              </p>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_INITIALS.map((d, i) => (
                  <div key={i} className="text-center font-mono text-[8px] text-atlas-faint leading-none pb-0.5">
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

                  if (!inMonth) return <div key={dateStr} className="w-full aspect-square" />

                  const dayCamps = campsForDate(dateStr)
                  const dayActivities = activityMap.get(dateStr) ?? []
                  const isRest = restDaySet.has(dateStr)
                  const hasComp = dayActivities.some((a) => a.intensity_type === 'competition')
                  const hasInterval = dayActivities.some((a) => a.intensity_type === 'interval')
                  const hasActivities = dayActivities.length > 0
                  const inCamp = dayCamps.length > 0
                  const { week, year: weekYear } = getISOWeek(day)

                  return (
                    <button
                      key={dateStr}
                      onClick={() => router.push(`/plan?view=week&week=${week}&year=${weekYear}`)}
                      title={dateStr}
                      className={`w-full aspect-square flex items-center justify-center transition-opacity hover:opacity-60 ${isToday ? 'ring-1 ring-atlas-accent' : ''}`}
                      style={inCamp ? { backgroundColor: 'rgba(58,125,74,0.12)' } : {}}
                    >
                      {hasComp ? (
                        <span className="leading-none" style={{ fontSize: '55%', color: '#b8860b' }}>★</span>
                      ) : hasInterval ? (
                        <span className="w-2 h-2 block" style={{ backgroundColor: 'var(--atlas-accent)' }} />
                      ) : hasActivities ? (
                        <span className="w-2 h-2 block" style={{ backgroundColor: inCamp ? '#3a7d4a' : 'var(--atlas-muted)' }} />
                      ) : isRest ? (
                        <span className="w-1.5 h-1.5 block border border-atlas-rule" />
                      ) : (
                        <span className="w-1.5 h-1.5 block" style={{ backgroundColor: 'var(--atlas-rule)' }} />
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
