import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { coachCanViewAthlete } from '@/lib/coach'
import { AppShell } from '@/components/layout/AppShell'
import { ActivityCalendar } from '@/components/activities/ActivityCalendar'

export const metadata = { title: 'Athlete — Atlas' }

export default async function CoachAthleteCalendarPage({
  params,
}: {
  params: { athleteId: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'coach') redirect('/activities')

  const { athleteId } = params
  const hasAccess = await coachCanViewAthlete(session.userId, athleteId)
  if (!hasAccess) redirect('/coach')

  const db = createServiceClient()
  const now = new Date()
  const start = new Date(now.getFullYear() - 3, now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 1)
  const startDate = start.toISOString().slice(0, 10)
  const endDate = end.toISOString().slice(0, 10)

  const [
    { data: athleteProfile },
    { data: activities },
    { data: zoneData },
    { data: userSettingsData },
    { data: illnessData },
  ] = await Promise.all([
    db.from('user_profiles').select('display_name').eq('id', athleteId).single(),
    db.from('activities')
      .select('*')
      .eq('user_id', athleteId)
      .eq('hidden', false)
      .gte('start_date', start.toISOString())
      .lt('start_date', end.toISOString())
      .order('start_date', { ascending: false })
      .limit(5000),
    db.from('hr_zone_settings').select('rest_day_threshold_minutes').eq('user_id', athleteId).maybeSingle(),
    db.from('user_settings').select('*').eq('user_id', athleteId).maybeSingle(),
    db.from('illness_log')
      .select('*')
      .eq('user_id', athleteId)
      .lte('start_date', endDate)
      .gte('end_date', startDate),
  ])

  const athleteName = athleteProfile?.display_name ?? 'Athlete'

  return (
    <AppShell viewingAthleteId={athleteId} viewingAthleteName={athleteName}>
      <ActivityCalendar
        activities={activities ?? []}
        initialMonth={new Date(now.getFullYear(), now.getMonth(), 1)}
        restDayThresholdMinutes={zoneData?.rest_day_threshold_minutes ?? 0}
        isCoach={true}
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
