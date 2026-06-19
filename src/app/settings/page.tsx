import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { HRZoneForm } from '@/components/settings/HRZoneForm'
import { UserSettingsForm } from '@/components/settings/UserSettingsForm'
import { StravaSyncSection } from '@/components/settings/StravaSyncSection'
import { TeamsCoachesSection } from '@/components/settings/TeamsCoachesSection'
import { getSession } from '@/lib/session'
import { createServiceClient, createSSRClient } from '@/lib/supabase/server'
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

  // Get athlete's email for invite lookup
  const ssr = createSSRClient()
  const { data: { user } } = await ssr.auth.getUser()
  const userEmail = user?.email ?? ''

  const [
    { data: zoneData },
    { data: profileData },
    { data: userSettingsData },
    { data: pendingInvitesRaw },
    { data: coachLinkRaw },
    { data: teamMemberRaw },
  ] = await Promise.all([
    db.from('hr_zone_settings').select('*').eq('user_id', session.userId).maybeSingle(),
    db.from('profiles').select('last_synced_at, strava_athlete_id').eq('user_id', session.userId).maybeSingle(),
    db.from('user_settings').select('*').eq('user_id', session.userId).maybeSingle(),
    userEmail
      ? db.from('invites').select('id, coach_id, team_id, status, profiles!invites_coach_id_fkey(display_name), teams(name)').eq('invitee_email', userEmail).eq('status', 'pending')
      : Promise.resolve({ data: [] }),
    db.from('coach_athlete_links').select('coach_id, linked_at, profiles!coach_athlete_links_coach_id_fkey(display_name)').eq('athlete_id', session.userId).maybeSingle(),
    db.from('team_members').select('team_id, joined_at, teams!inner(name, profiles!teams_coach_id_fkey(display_name))').eq('athlete_id', session.userId).is('left_at', null).maybeSingle(),
  ])

  // Shape data for TeamsCoachesSection
  const pendingInvites = (pendingInvitesRaw ?? []).map((inv: any) => ({
    id: inv.id,
    coachName: inv.profiles?.display_name ?? 'Coach',
    teamName: inv.teams?.name ?? null,
  }))

  const coachLink = coachLinkRaw
    ? {
        coachId: coachLinkRaw.coach_id,
        coachName: (coachLinkRaw.profiles as any)?.display_name ?? 'Coach',
        linkedAt: coachLinkRaw.linked_at,
      }
    : null

  const teamMembership = teamMemberRaw
    ? {
        teamId: teamMemberRaw.team_id,
        teamName: (teamMemberRaw.teams as any)?.name ?? 'Team',
        coachName: (teamMemberRaw.teams as any)?.profiles?.display_name ?? 'Coach',
        joinedAt: teamMemberRaw.joined_at,
      }
    : null

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
            show_lactate: userSettingsData?.show_lactate ?? false,
          }} />
        </Card>

        {session.role === 'athlete' && (
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Coach & Team</h2>
            <TeamsCoachesSection
              pendingInvites={pendingInvites}
              coachLink={coachLink}
              teamMembership={teamMembership}
            />
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Strava Sync</h2>
          {profileData?.strava_athlete_id ? (
            <StravaSyncSection lastSyncedAt={profileData.last_synced_at ?? null} />
          ) : (
            <div>
              <p className="font-sans text-[14px] text-atlas-muted mb-4">
                Connect your Strava account to start syncing activities.
              </p>
              <a
                href="/api/auth/strava"
                className="inline-flex items-center font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3 hover:opacity-85 transition-opacity"
                style={{ background: '#FC4C02', color: '#fff' }}
              >
                Connect with Strava →
              </a>
            </div>
          )}
        </Card>

      </div>
    </AppShell>
  )
}
