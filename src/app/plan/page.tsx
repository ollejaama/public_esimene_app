import { AppShell } from '@/components/layout/AppShell'
import { PlanWeekView } from '@/components/plan/PlanWeekView'
import { PlanMonthView } from '@/components/plan/PlanMonthView'
import { PlanSeasonView } from '@/components/plan/PlanSeasonView'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getISOWeek, getWeekStart, getWeekEnd } from '@/lib/analytics/weekSummary'
import { toDateStr, getSeasonYear } from '@/lib/planUtils'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Plan — Training Analytics' }

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { view?: string; week?: string; year?: string; month?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/')

  const view = (searchParams.view ?? 'week') as 'week' | 'month' | 'season'
  const now = new Date()

  const db = createServiceClient()

  if (view === 'season') {
    const seasonYear = searchParams.year ? parseInt(searchParams.year) : getSeasonYear(now)
    const rangeStart = new Date(seasonYear, 4, 1)       // May 1
    const rangeEnd = new Date(seasonYear + 1, 4, 1)     // May 1 next year
    const startStr = toDateStr(rangeStart)
    const endStr = toDateStr(rangeEnd)

    const [{ data: activities }, { data: camps }, { data: restDays }] = await Promise.all([
      db.from('planned_activities').select('*').eq('user_id', session.userId).gte('date', startStr).lt('date', endStr).order('date'),
      db.from('training_camps').select('*').eq('user_id', session.userId).lte('start_date', endStr).gte('end_date', startStr).order('start_date'),
      db.from('planned_rest_days').select('*').eq('user_id', session.userId).gte('date', startStr).lt('date', endStr).order('date'),
    ])

    return (
      <AppShell>
        <PlanSeasonView
          activities={activities ?? []}
          camps={camps ?? []}
          restDays={restDays ?? []}
          seasonYear={seasonYear}
        />
      </AppShell>
    )
  }

  if (view === 'month') {
    const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()
    const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1
    const rangeStart = new Date(year, month - 1, 1)
    const rangeEnd = new Date(year, month, 1)
    const startStr = toDateStr(rangeStart)
    const endStr = toDateStr(rangeEnd)

    const [{ data: activities }, { data: camps }, { data: restDays }] = await Promise.all([
      db.from('planned_activities').select('*').eq('user_id', session.userId).gte('date', startStr).lt('date', endStr).order('date'),
      db.from('training_camps').select('*').eq('user_id', session.userId).lte('start_date', endStr).gte('end_date', startStr).order('start_date'),
      db.from('planned_rest_days').select('*').eq('user_id', session.userId).gte('date', startStr).lt('date', endStr).order('date'),
    ])

    return (
      <AppShell>
        <PlanMonthView
          activities={activities ?? []}
          camps={camps ?? []}
          restDays={restDays ?? []}
          month={month}
          year={year}
        />
      </AppShell>
    )
  }

  // Week view (default)
  const currentWeekInfo = getISOWeek(now)
  const week = searchParams.week ? parseInt(searchParams.week) : currentWeekInfo.week
  const year = searchParams.year ? parseInt(searchParams.year) : currentWeekInfo.year
  const weekStart = getWeekStart(year, week)
  const weekEnd = getWeekEnd(weekStart)
  const weekStartStr = toDateStr(weekStart)
  const weekEndStr = toDateStr(weekEnd)

  const [{ data: activities }, { data: camps }, { data: restDays }] = await Promise.all([
    db.from('planned_activities').select('*').eq('user_id', session.userId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
    db.from('training_camps').select('*').eq('user_id', session.userId).lte('start_date', weekEndStr).gte('end_date', weekStartStr).order('start_date'),
    db.from('planned_rest_days').select('*').eq('user_id', session.userId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
  ])

  return (
    <AppShell>
      <PlanWeekView
        plannedActivities={activities ?? []}
        camps={camps ?? []}
        restDays={restDays ?? []}
        weekStart={weekStart}
        week={week}
        year={year}
      />
    </AppShell>
  )
}
