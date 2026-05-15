import { AppShell } from '@/components/layout/AppShell'
import { CompareWeekView } from '@/components/compare/CompareWeekView'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getISOWeek, getWeekStart, getWeekEnd } from '@/lib/analytics/weekSummary'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Compare — Training Analytics' }

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { week?: string; year?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/')

  const isCoach = session.role === 'coach'

  const now = new Date()
  const currentWeekInfo = getISOWeek(now)

  const week = searchParams.week ? parseInt(searchParams.week) : currentWeekInfo.week
  const year = searchParams.year ? parseInt(searchParams.year) : currentWeekInfo.year

  const weekStart = getWeekStart(year, week)
  const weekEnd = getWeekEnd(weekStart)

  const weekStartStr = toDateStr(weekStart)
  const weekEndStr = toDateStr(weekEnd)

  const db = createServiceClient()

  let actualQuery = db
    .from('activities')
    .select('*')
    .eq('user_id', session.userId)
    .gte('start_date', weekStart.toISOString())
    .lt('start_date', weekEnd.toISOString())
    .order('start_date', { ascending: true })

  if (isCoach) actualQuery = actualQuery.eq('hidden', false) as typeof actualQuery

  const [{ data: plannedActivities }, { data: actualActivities }, { data: illnessData }] = await Promise.all([
    db
      .from('planned_activities')
      .select('*')
      .eq('user_id', session.userId)
      .gte('date', weekStartStr)
      .lt('date', weekEndStr)
      .order('date', { ascending: true }),
    actualQuery,
    db.from('illness_log').select('*').eq('user_id', session.userId)
      .lte('start_date', weekEndStr)
      .gte('end_date', weekStartStr),
  ])

  return (
    <AppShell>
      <CompareWeekView
        plannedActivities={plannedActivities ?? []}
        actualActivities={actualActivities ?? []}
        weekStart={weekStart}
        week={week}
        year={year}
        isCoach={isCoach}
        illnessEntries={illnessData ?? []}
      />
    </AppShell>
  )
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
