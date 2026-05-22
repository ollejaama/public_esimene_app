import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { HRZoneForm } from '@/components/settings/HRZoneForm'
import { UserSettingsForm } from '@/components/settings/UserSettingsForm'
import { StravaSyncSection } from '@/components/settings/StravaSyncSection'
import { TeamsCoachesSection } from '@/components/settings/TeamsCoachesSection'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getPendingInvitesForAthlete, getAthleteCoachInfo } from '@/lib/coach'
import { Card } from '@/components/ui/Card'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Settings — Training Analytics' }

const DEFAULT_ZONES = {
  zone1_max: 130,
  zone2_max: 148,
  zone3_max: 162,
  zone4_max: 174,
  zone1_name: 'I1',
  zone2_name: 'I2',
  zone3_name: 'I3',
  zone4_name: 'I4',
  zone5_name: 'I5',
  rest_day_threshold_minutes: 0,
}

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const db = createServiceClient()

  const { data: { user: authUser } } = await db.auth.admin.getUserById(session.userId)
  const athleteEmail = authUser?.email ?? ''

  const [{ data: zoneData }, { data: profileData }, { data: userSettingsData }, pendingInvites, coachInfo] = await Promise.all([
    db.from('hr_zone_settings').select('*').eq('user_id', session.userId).maybeSingle(),
    db.from('profiles').select('last_synced_at').eq('user_id', session.userId).maybeSingle(),
    db.from('user_settings').select('*').eq('user_id', session.userId).maybeSingle(),
    getPendingInvitesForAthlete(session.userId, athleteEmail),
    getAthleteCoachInfo(session.userId),
  ])

  const zones = zoneData
    ? {
        zone1_max: zoneData.zone1_max,
        zone2_max: zoneData.zone2_max,
        zone3_max: zoneData.zone3_max,
        zone4_max: zoneData.zone4_max,
        zone1_name: zoneData.zone1_name,
        zone2_name: zoneData.zone2_name,
        zone3_name: zoneData.zone3_name,
        zone4_name: zoneData.zone4_name,
        zone5_name: zoneData.zone5_name,
        rest_day_threshold_minutes: zoneData.rest_day_threshold_minutes ?? 0,
      }
    : DEFAULT_ZONES

  return (
    <AppShell>
      <PageHeader title="Settings" />

      <div className="space-y-6 max-w-2xl">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">HR Zone Configuration</h2>
          <HRZoneForm initialZones={zones} />
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Features</h2>
          <UserSettingsForm initial={{
            show_rpe: userSettingsData?.show_rpe ?? false,
            rpe_scale: (userSettingsData?.rpe_scale as 'rpe' | 'borg') ?? 'rpe',
            show_lactate: userSettingsData?.show_lactate ?? false,
          }} />
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Strava Sync</h2>
          <StravaSyncSection
            lastSyncedAt={profileData?.last_synced_at ?? null}
            isStravaConnected={!!profileData}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Teams &amp; Coaches</h2>
          <TeamsCoachesSection
            pendingInvites={pendingInvites}
            coach={coachInfo.coach}
            team={coachInfo.team}
          />
        </Card>

      </div>
    </AppShell>
  )
}
