import { AppShell } from '@/components/layout/AppShell'
import { WeekNavigator } from '@/components/dashboard/WeekNavigator'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { HRZoneTable } from '@/components/dashboard/HRZoneTable'
import { ActivityBreakdownTable } from '@/components/dashboard/ActivityBreakdownTable'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getISOWeek, getWeekStart, getWeekEnd, aggregateWeek } from '@/lib/analytics/weekSummary'
import { zoneSecondsToRows } from '@/lib/analytics/hrZones'
import { redirect } from 'next/navigation'
import { HRZoneSettings } from '@/lib/supabase/types'

export const metadata = { title: 'Dashboard — Training Analytics' }

const DEFAULT_ZONES: HRZoneSettings = {
  id: '',
  user_id: '',
  zone1_max: 130,
  zone2_max: 148,
  zone3_max: 162,
  zone4_max: 174,
  zone1_name: 'I1',
  zone2_name: 'I2',
  zone3_name: 'I3',
  zone4_name: 'I4',
  zone5_name: 'I5',
  updated_at: '',
}

export default async function DashboardPage({
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

  const db = createServiceClient()

  const [{ data: activities }, { data: profile }, { data: zoneData }] = await Promise.all([
    db
      .from('activities')
      .select('*')
      .eq('user_id', session.userId)
      .gte('start_date', weekStart.toISOString())
      .lt('start_date', weekEnd.toISOString())
      .order('start_date', { ascending: false }),
    db
      .from('profiles')
      .select('strava_athlete_id')
      .eq('user_id', session.userId)
      .single(),
    db
      .from('hr_zone_settings')
      .select('*')
      .eq('user_id', session.userId)
      .maybeSingle(),
  ])

  const zones: HRZoneSettings = zoneData ?? DEFAULT_ZONES

  // Fetch HR streams for activities that have HR data
  const hrActivityIds = (activities ?? [])
    .filter((a) => a.has_hr_data)
    .map((a) => a.id)

  const { data: streams } = hrActivityIds.length > 0
    ? await db
        .from('activity_hr_streams')
        .select('*')
        .in('activity_id', hrActivityIds)
    : { data: [] }

  const summary = aggregateWeek(activities ?? [], streams ?? [], zones)
  const zoneRows = zoneSecondsToRows(summary.zoneSeconds, zones)

  return (
    <AppShell>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <WeekNavigator week={week} year={year} />
      </div>

      {/* Summary cards */}
      <SummaryCards summary={summary} />

      {/* Bottom two-column layout */}
      <div className="grid grid-cols-[280px_1fr] gap-6 mt-6">
        {/* HR Zone Table */}
        <div className="border border-[#e5e5e5] rounded-lg p-5">
          <HRZoneTable zones={zoneRows} />
        </div>

        {/* Activity breakdown */}
        <div className="border border-[#e5e5e5] rounded-lg p-5 overflow-x-auto">
          <ActivityBreakdownTable activities={activities ?? []} />
        </div>
      </div>
    </AppShell>
  )
}
