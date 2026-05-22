import { AppShell } from '@/components/layout/AppShell'
import { PlanWeekView } from '@/components/plan/PlanWeekView'
import { PlanMonthView } from '@/components/plan/PlanMonthView'
import { PlanSeasonView } from '@/components/plan/PlanSeasonView'
import { TeamPlanWeekView } from '@/components/plan/TeamPlanWeekView'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getISOWeek, getWeekStart, getWeekEnd } from '@/lib/analytics/weekSummary'
import { toDateStr, getSeasonYear } from '@/lib/planUtils'
import { redirect } from 'next/navigation'
import type { TeamPlannedActivity, TeamPlannedRestDay, TeamTrainingCamp } from '@/lib/supabase/types'

export const metadata = { title: 'Plan — Training Analytics' }

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { view?: string; week?: string; year?: string; month?: string; planView?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/')

  const view = (searchParams.view ?? 'week') as 'week' | 'month' | 'season'
  const planView = (searchParams.planView ?? 'my') as 'my' | 'team'
  const now = new Date()
  const db = createServiceClient()

  // Find the athlete's team (if any)
  const { data: teamMembership } = await db
    .from('team_members')
    .select('team_id')
    .eq('athlete_id', session.userId)
    .maybeSingle()

  const teamId = teamMembership?.team_id ?? null
  const { data: teamInfo } = teamId
    ? await db.from('teams').select('name').eq('id', teamId).maybeSingle()
    : { data: null }
  const teamName = teamInfo?.name ?? ''
  const hasTeam = !!teamId

  // --- SEASON view ---
  if (view === 'season') {
    const seasonYear = searchParams.year ? parseInt(searchParams.year) : getSeasonYear(now)
    const rangeStart = new Date(seasonYear, 4, 1)
    const rangeEnd = new Date(seasonYear + 1, 4, 1)
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

  // --- MONTH view ---
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

  // --- WEEK view (default) ---
  const currentWeekInfo = getISOWeek(now)
  const week = searchParams.week ? parseInt(searchParams.week) : currentWeekInfo.week
  const year = searchParams.year ? parseInt(searchParams.year) : currentWeekInfo.year
  const weekStart = getWeekStart(year, week)
  const weekEnd = getWeekEnd(weekStart)
  const weekStartStr = toDateStr(weekStart)
  const weekEndStr = toDateStr(weekEnd)

  // Team plan view — read-only team plan for athlete
  if (planView === 'team' && teamId) {
    const [{ data: tpActivities }, { data: tpCamps }, { data: tpRestDays }] = await Promise.all([
      db.from('team_planned_activities').select('*').eq('team_id', teamId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
      db.from('team_training_camps').select('*').eq('team_id', teamId).lte('start_date', weekEndStr).gte('end_date', weekStartStr).order('start_date'),
      db.from('team_planned_rest_days').select('*').eq('team_id', teamId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
    ])

    return (
      <AppShell>
        <TeamPlanWeekView
          teamId={teamId}
          teamName={teamName}
          teamActivities={(tpActivities ?? []) as TeamPlannedActivity[]}
          teamRestDays={(tpRestDays ?? []) as TeamPlannedRestDay[]}
          teamCamps={(tpCamps ?? []) as TeamTrainingCamp[]}
          weekStart={weekStart}
          week={week}
          year={year}
          editable={false}
          basePath="/plan"
          planView="team"
          hasMyPlan={true}
          athletePlanBasePath="/plan"
        />
      </AppShell>
    )
  }

  // My plan view — personal plan + team activities alongside
  const [{ data: activities }, { data: camps }, { data: restDays }] = await Promise.all([
    db.from('planned_activities').select('*').eq('user_id', session.userId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
    db.from('training_camps').select('*').eq('user_id', session.userId).lte('start_date', weekEndStr).gte('end_date', weekStartStr).order('start_date'),
    db.from('planned_rest_days').select('*').eq('user_id', session.userId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
  ])

  let teamActivities: TeamPlannedActivity[] = []
  let teamRestDaysArr: TeamPlannedRestDay[] = []
  let teamCampsArr: TeamTrainingCamp[] = []

  if (teamId) {
    const [{ data: tpa }, { data: tpr }, { data: tpc }] = await Promise.all([
      db.from('team_planned_activities').select('*').eq('team_id', teamId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
      db.from('team_planned_rest_days').select('*').eq('team_id', teamId).gte('date', weekStartStr).lt('date', weekEndStr).order('date'),
      db.from('team_training_camps').select('*').eq('team_id', teamId).lte('start_date', weekEndStr).gte('end_date', weekStartStr).order('start_date'),
    ])
    teamActivities = (tpa ?? []) as TeamPlannedActivity[]
    teamRestDaysArr = (tpr ?? []) as TeamPlannedRestDay[]
    teamCampsArr = (tpc ?? []) as TeamTrainingCamp[]
  }

  return (
    <AppShell>
      <PlanWeekView
        plannedActivities={activities ?? []}
        camps={camps ?? []}
        restDays={restDays ?? []}
        teamActivities={teamActivities}
        teamRestDays={teamRestDaysArr}
        teamCamps={teamCampsArr}
        weekStart={weekStart}
        week={week}
        year={year}
        hasTeam={hasTeam}
        realtimeUserId={session.userId}
      />
    </AppShell>
  )
}
