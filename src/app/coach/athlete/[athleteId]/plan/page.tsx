import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { coachCanViewAthlete } from '@/lib/coach'
import { AppShell } from '@/components/layout/AppShell'
import { PlanWeekView } from '@/components/plan/PlanWeekView'
import { getISOWeek, getWeekStart, getWeekEnd } from '@/lib/analytics/weekSummary'
import { toDateStr } from '@/lib/planUtils'

export const metadata = { title: 'Athlete Plan — Atlas' }

export default async function CoachAthletePlanPage({
  params,
  searchParams,
}: {
  params: { athleteId: string }
  searchParams: { week?: string; year?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'coach') redirect('/activities')

  const { athleteId } = params
  const hasAccess = await coachCanViewAthlete(session.userId, athleteId)
  if (!hasAccess) redirect('/coach')

  const db = createServiceClient()
  const { data: athleteProfile } = await db
    .from('user_profiles')
    .select('display_name')
    .eq('id', athleteId)
    .single()

  const athleteName = athleteProfile?.display_name ?? 'Athlete'

  const now = new Date()
  const currentWeekInfo = getISOWeek(now)
  const week = searchParams.week ? parseInt(searchParams.week) : currentWeekInfo.week
  const year = searchParams.year ? parseInt(searchParams.year) : currentWeekInfo.year
  const weekStart = getWeekStart(year, week)
  const weekEnd = getWeekEnd(weekStart)
  const weekStartStr = toDateStr(weekStart)
  const weekEndStr = toDateStr(weekEnd)

  const [{ data: activities }, { data: camps }, { data: restDays }] = await Promise.all([
    db.from('planned_activities').select('*').eq('user_id', athleteId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
    db.from('training_camps').select('*').eq('user_id', athleteId).lte('start_date', weekEndStr).gte('end_date', weekStartStr).order('start_date'),
    db.from('planned_rest_days').select('*').eq('user_id', athleteId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
  ])

  const apiPrefix = `/api/coach/athlete/${athleteId}`

  return (
    <AppShell viewingAthleteId={athleteId} viewingAthleteName={athleteName}>
      <PlanWeekView
        plannedActivities={activities ?? []}
        camps={camps ?? []}
        restDays={restDays ?? []}
        weekStart={weekStart}
        week={week}
        year={year}
        activityApiBase={`${apiPrefix}/planned-activities`}
        restDayApiBase={`${apiPrefix}/planned-rest-days`}
        campApiBase={`${apiPrefix}/training-camps`}
        editingLabel={`✎ Editing ${athleteName}'s plan`}
      />
    </AppShell>
  )
}
