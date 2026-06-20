import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = createServiceClient()

  const [{ data: links }, { data: teams }] = await Promise.all([
    db.from('coach_athlete_links').select('athlete_id, linked_at').eq('coach_id', session.userId),
    db.from('teams').select('id, name, team_members(athlete_id)').eq('coach_id', session.userId).order('created_at', { ascending: true }),
  ])

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

  const teamsWithCount = (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    memberCount: (t.team_members as unknown[])?.length ?? 0,
  }))

  return NextResponse.json({ athletes, teams: teamsWithCount })
}
