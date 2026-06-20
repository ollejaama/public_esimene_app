import { AppShell } from '@/components/layout/AppShell'
import { ActivityCalendar } from '@/components/activities/ActivityCalendar'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CoachAthleteView({
  params,
}: {
  params: { userId: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'coach') redirect('/home')

  const db = createServiceClient()

  // Verify this athlete is linked to this coach
  const { data: link } = await db
    .from('coach_athlete_links')
    .select('athlete_id')
    .eq('coach_id', session.userId)
    .eq('athlete_id', params.userId)
    .maybeSingle()

  if (!link) notFound()

  const { data: athleteProfile } = await db
    .from('profiles')
    .select('display_name')
    .eq('user_id', params.userId)
    .maybeSingle()

  const athleteName = athleteProfile?.display_name ?? 'Athlete'

  const now = new Date()
  const start = new Date(now.getFullYear() - 3, now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 1)
  const startDate = start.toISOString().slice(0, 10)
  const endDate = end.toISOString().slice(0, 10)

  const [{ data: activities }, { data: zoneData }, { data: userSettingsData }, { data: illnessData }] =
    await Promise.all([
      db
        .from('activities')
        .select('*')
        .eq('user_id', params.userId)
        .eq('hidden', false)
        .gte('start_date', start.toISOString())
        .lt('start_date', end.toISOString())
        .order('start_date', { ascending: false })
        .limit(5000),
      db.from('hr_zone_settings').select('rest_day_threshold_minutes').eq('user_id', params.userId).maybeSingle(),
      db.from('user_settings').select('*').eq('user_id', params.userId).maybeSingle(),
      db
        .from('illness_log')
        .select('*')
        .eq('user_id', params.userId)
        .lte('start_date', endDate)
        .gte('end_date', startDate),
    ])

  return (
    <AppShell>
      {/* Read-only banner */}
      <div
        className="mb-6 px-4 py-2 border border-atlas-rule font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted"
        style={{ background: 'var(--atlas-panel)' }}
      >
        Viewing {athleteName}&apos;s training — read only
      </div>

      <ActivityCalendar
        activities={activities ?? []}
        initialMonth={new Date(now.getFullYear(), now.getMonth(), 1)}
        restDayThresholdMinutes={zoneData?.rest_day_threshold_minutes ?? 0}
        isCoach={true}
        viewAsUserId={params.userId}
        illnessEntries={illnessData ?? []}
        userSettings={{
          show_rpe: userSettingsData?.show_rpe ?? false,
          show_lactate: userSettingsData?.show_lactate ?? false,
        }}
      />
    </AppShell>
  )
}
