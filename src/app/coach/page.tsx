import { AppShell } from '@/components/layout/AppShell'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CoachDashboard } from './CoachDashboard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Coach — Atlas' }

export default async function CoachPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'coach') redirect('/home')

  const db = createServiceClient()

  const [{ data: links }, { data: teams }] = await Promise.all([
    db.from('coach_athlete_links').select('athlete_id, linked_at').eq('coach_id', session.userId),
    db.from('teams').select('id, name, team_members(athlete_id)').eq('coach_id', session.userId).order('created_at', { ascending: true }),
  ])

  // Fetch profiles for linked athletes separately (no FK constraint for join)
  const athleteIds = (links ?? []).map((l) => l.athlete_id)
  const { data: profiles } = athleteIds.length > 0
    ? await db.from('profiles').select('user_id, display_name, email').in('user_id', athleteIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  const athleteTeamMap = new Map<string, string>()
  for (const team of teams ?? []) {
    for (const member of (team.team_members as { athlete_id: string }[]) ?? []) {
      athleteTeamMap.set(member.athlete_id, team.name)
    }
  }

  const athletes = (links ?? []).map((link) => {
    const profile = profileMap.get(link.athlete_id)
    return {
      userId: link.athlete_id,
      displayName: profile?.display_name ?? link.athlete_id,
      email: profile?.email ?? '',
      linkedAt: link.linked_at,
      teamName: athleteTeamMap.get(link.athlete_id) ?? null,
    }
  })

  const teamsData = (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    memberCount: (t.team_members as unknown[])?.length ?? 0,
  }))

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            Coach dashboard
          </p>
          <h1 className="font-serif text-[56px] tracking-[-0.03em] leading-[1.05] text-atlas-ink mt-1.5">
            My <em>athletes</em>
          </h1>
        </div>
      </div>

      <CoachDashboard initialAthletes={athletes} initialTeams={teamsData} />
    </AppShell>
  )
}
