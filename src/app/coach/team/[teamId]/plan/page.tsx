import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { TeamPlanWeekView } from '@/components/plan/TeamPlanWeekView'
import { getISOWeek, getWeekStart, getWeekEnd } from '@/lib/analytics/weekSummary'
import { toDateStr } from '@/lib/planUtils'

export const metadata = { title: 'Team Plan — Atlas' }

export default async function CoachTeamPlanPage({
  params,
  searchParams,
}: {
  params: { teamId: string }
  searchParams: { week?: string; year?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'coach') redirect('/activities')

  const { teamId } = params
  const db = createServiceClient()

  // Verify this coach owns the team
  const { data: team } = await db
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .eq('coach_id', session.userId)
    .maybeSingle()

  if (!team) redirect('/coach')

  const now = new Date()
  const currentWeekInfo = getISOWeek(now)
  const week = searchParams.week ? parseInt(searchParams.week) : currentWeekInfo.week
  const year = searchParams.year ? parseInt(searchParams.year) : currentWeekInfo.year
  const weekStart = getWeekStart(year, week)
  const weekEnd = getWeekEnd(weekStart)
  const weekStartStr = toDateStr(weekStart)
  const weekEndStr = toDateStr(weekEnd)

  const [{ data: teamActivities }, { data: teamCamps }, { data: teamRestDays }] = await Promise.all([
    db.from('team_planned_activities').select('*').eq('team_id', teamId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
    db.from('team_training_camps').select('*').eq('team_id', teamId).lte('start_date', weekEndStr).gte('end_date', weekStartStr).order('start_date'),
    db.from('team_planned_rest_days').select('*').eq('team_id', teamId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
  ])

  return (
    <AppShell>
      <TeamPlanWeekView
        teamId={teamId}
        teamName={team.name}
        teamActivities={teamActivities ?? []}
        teamRestDays={teamRestDays ?? []}
        teamCamps={teamCamps ?? []}
        weekStart={weekStart}
        week={week}
        year={year}
        editable={true}
        basePath={`/coach/team/${teamId}/plan`}
      />
    </AppShell>
  )
}
