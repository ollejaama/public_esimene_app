import { AppShell } from '@/components/layout/AppShell'
import { PlanWeekView } from '@/components/plan/PlanWeekView'
import { PlanRefresher } from '@/components/sync/PlanRefresher'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getISOWeek, getWeekStart, getWeekEnd } from '@/lib/analytics/weekSummary'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Plan — Training Analytics' }

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { week?: string; year?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/')

  const now = new Date()
  const currentWeekInfo = getISOWeek(now)

  const week = searchParams.week ? parseInt(searchParams.week) : currentWeekInfo.week
  const year = searchParams.year ? parseInt(searchParams.year) : currentWeekInfo.year

  const weekStart = getWeekStart(year, week)
  const weekEnd = getWeekEnd(weekStart)

  // Format as YYYY-MM-DD for date column comparison
  const weekStartStr = toDateStr(weekStart)
  const weekEndStr = toDateStr(weekEnd)

  const db = createServiceClient()
  const { data: plannedActivities } = await db
    .from('planned_activities')
    .select('*')
    .eq('user_id', session.userId)
    .gte('date', weekStartStr)
    .lt('date', weekEndStr)
    .order('date', { ascending: true })

  return (
    <AppShell>
      <PlanRefresher />
      <PlanWeekView
        plannedActivities={plannedActivities ?? []}
        weekStart={weekStart}
        week={week}
        year={year}
      />
    </AppShell>
  )
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
