import { AppShell } from '@/components/layout/AppShell'
import { ActivityCalendar } from '@/components/activities/ActivityCalendar'
import { SyncRefresher } from '@/components/sync/SyncRefresher'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Calendar — Training Analytics' }

export default async function ActivitiesPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const db = createServiceClient()
  const now = new Date()

  // Fetch 3 years back + 2 months forward for full calendar coverage
  const start = new Date(now.getFullYear() - 3, now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 1)

  const isCoach = session.role === 'coach'

  let query = db
    .from('activities')
    .select('*')
    .eq('user_id', session.userId)
    .gte('start_date', start.toISOString())
    .lt('start_date', end.toISOString())
    .order('start_date', { ascending: false })
    .limit(5000)

  // Coach never sees hidden activities
  if (isCoach) query = query.eq('hidden', false) as typeof query

  const startDate = start.toISOString().slice(0, 10)
  const endDate = end.toISOString().slice(0, 10)

  const [{ data: activities }, { data: zoneData }, { data: userSettingsData }, { data: illnessData }] = await Promise.all([
    query,
    db.from('hr_zone_settings').select('rest_day_threshold_minutes').eq('user_id', session.userId).maybeSingle(),
    db.from('user_settings').select('*').eq('user_id', session.userId).maybeSingle(),
    db.from('illness_log').select('*').eq('user_id', session.userId)
      .lte('start_date', endDate)
      .gte('end_date', startDate),
  ])

  const restDayThresholdMinutes = zoneData?.rest_day_threshold_minutes ?? 0

  return (
    <AppShell>
      <SyncRefresher />
      <ActivityCalendar
        activities={activities ?? []}
        initialMonth={new Date(now.getFullYear(), now.getMonth(), 1)}
        restDayThresholdMinutes={restDayThresholdMinutes}
        isCoach={isCoach}
        illnessEntries={illnessData ?? []}
        userSettings={{
          show_rpe: userSettingsData?.show_rpe ?? false,
          rpe_scale: (userSettingsData?.rpe_scale as 'rpe' | 'borg') ?? 'rpe',
          show_lactate: userSettingsData?.show_lactate ?? false,
        }}
      />
    </AppShell>
  )
}
