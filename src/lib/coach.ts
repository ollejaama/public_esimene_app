import { createServiceClient } from '@/lib/supabase/server'

export interface CoachAthlete {
  id: string
  display_name: string | null
  avatar_url: string | null
  last_synced_at: string | null
  link_type: 'direct' | 'team'
  team_id: string | null
  team_name: string | null
}

export interface CoachTeam {
  id: string
  name: string
  created_at: string
  member_count: number
  members: { id: string; display_name: string | null; avatar_url: string | null }[]
}

export interface PendingInvite {
  id: string
  token: string
  invited_email: string
  invited_user_id: string | null
  invited_name: string | null
  team_id: string | null
  team_name: string | null
  created_at: string
  expires_at: string
}

export async function coachCanViewAthlete(
  coachId: string,
  athleteId: string
): Promise<boolean> {
  const db = createServiceClient()

  const { data: direct } = await db
    .from('coach_athlete_links')
    .select('id')
    .eq('coach_id', coachId)
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (direct) return true

  const { data: member } = await db
    .from('team_members')
    .select('id, team_id')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (!member) return false

  const { data: team } = await db
    .from('teams')
    .select('id')
    .eq('id', member.team_id)
    .eq('coach_id', coachId)
    .maybeSingle()

  return !!team
}

export async function getCoachAthletes(coachId: string): Promise<CoachAthlete[]> {
  const db = createServiceClient()

  const [{ data: directLinks }, { data: teams }] = await Promise.all([
    db.from('coach_athlete_links').select('athlete_id, created_at').eq('coach_id', coachId),
    db.from('teams').select('id, name').eq('coach_id', coachId),
  ])

  const teamIds = (teams ?? []).map((t) => t.id)
  const { data: teamMembers } = teamIds.length > 0
    ? await db.from('team_members').select('athlete_id, team_id').in('team_id', teamIds)
    : { data: [] as { athlete_id: string; team_id: string }[] }

  const directAthleteIds = (directLinks ?? []).map((l) => l.athlete_id)
  const teamAthleteIds = (teamMembers ?? []).map((m) => m.athlete_id)
  const allIds = Array.from(new Set([...directAthleteIds, ...teamAthleteIds]))

  if (allIds.length === 0) return []

  const [{ data: profiles }, { data: stravaPrfoiles }] = await Promise.all([
    db.from('user_profiles').select('id, display_name, avatar_url').in('id', allIds),
    db.from('profiles').select('user_id, last_synced_at').in('user_id', allIds),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const stravaMap = new Map((stravaPrfoiles ?? []).map((p) => [p.user_id, p.last_synced_at]))
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]))
  const memberTeamMap = new Map((teamMembers ?? []).map((m) => [m.athlete_id, m.team_id]))

  return allIds.map((id) => {
    const profile = profileMap.get(id)
    const teamId = memberTeamMap.get(id) ?? null
    return {
      id,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      last_synced_at: stravaMap.get(id) ?? null,
      link_type: teamId ? 'team' : 'direct',
      team_id: teamId,
      team_name: teamId ? (teamMap.get(teamId) ?? null) : null,
    }
  })
}

export async function getCoachTeams(coachId: string): Promise<CoachTeam[]> {
  const db = createServiceClient()

  const { data: teams } = await db
    .from('teams')
    .select('id, name, created_at')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })

  if (!teams || teams.length === 0) return []

  const teamIds = teams.map((t) => t.id)
  const { data: members } = await db
    .from('team_members')
    .select('team_id, athlete_id')
    .in('team_id', teamIds)

  const athleteIds = (members ?? []).map((m) => m.athlete_id)
  const { data: profiles } = athleteIds.length > 0
    ? await db.from('user_profiles').select('id, display_name, avatar_url').in('id', athleteIds)
    : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  return teams.map((team) => {
    const teamMembers = (members ?? []).filter((m) => m.team_id === team.id)
    return {
      id: team.id,
      name: team.name,
      created_at: team.created_at,
      member_count: teamMembers.length,
      members: teamMembers.map((m) => ({
        id: m.athlete_id,
        display_name: profileMap.get(m.athlete_id)?.display_name ?? null,
        avatar_url: profileMap.get(m.athlete_id)?.avatar_url ?? null,
      })),
    }
  })
}

export async function getPendingInvitesByCoach(coachId: string): Promise<PendingInvite[]> {
  const db = createServiceClient()

  const { data: invites } = await db
    .from('invites')
    .select('id, token, invited_email, invited_user_id, team_id, created_at, expires_at')
    .eq('invited_by', coachId)
    .is('accepted_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (!invites || invites.length === 0) return []

  const teamIds = Array.from(new Set(invites.map((i) => i.team_id).filter(Boolean) as string[]))
  const userIds = Array.from(new Set(invites.map((i) => i.invited_user_id).filter(Boolean) as string[]))

  const [{ data: teams }, { data: invitedProfiles }] = await Promise.all([
    teamIds.length > 0
      ? db.from('teams').select('id, name').in('id', teamIds)
      : { data: [] as { id: string; name: string }[] },
    userIds.length > 0
      ? db.from('user_profiles').select('id, display_name').in('id', userIds)
      : { data: [] as { id: string; display_name: string | null }[] },
  ])

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]))
  const profileMap = new Map((invitedProfiles ?? []).map((p) => [p.id, p.display_name]))

  return invites.map((inv) => ({
    id: inv.id,
    token: inv.token,
    invited_email: inv.invited_email,
    invited_user_id: inv.invited_user_id ?? null,
    invited_name: inv.invited_user_id ? (profileMap.get(inv.invited_user_id) ?? null) : null,
    team_id: inv.team_id ?? null,
    team_name: inv.team_id ? (teamMap.get(inv.team_id) ?? null) : null,
    created_at: inv.created_at,
    expires_at: inv.expires_at,
  }))
}

export async function getPendingInvitesForAthlete(
  athleteId: string,
  athleteEmail: string
): Promise<(PendingInvite & { coach_name: string | null })[]> {
  const db = createServiceClient()

  const { data: invites } = await db
    .from('invites')
    .select('id, token, invited_email, invited_user_id, invited_by, team_id, created_at, expires_at')
    .is('accepted_at', null)
    .gte('expires_at', new Date().toISOString())
    .or(`invited_email.eq.${athleteEmail},invited_user_id.eq.${athleteId}`)
    .order('created_at', { ascending: false })

  if (!invites || invites.length === 0) return []

  const coachIds = Array.from(new Set(invites.map((i) => i.invited_by)))
  const teamIds = Array.from(new Set(invites.map((i) => i.team_id).filter(Boolean) as string[]))

  const [{ data: coaches }, { data: teams }] = await Promise.all([
    db.from('user_profiles').select('id, display_name').in('id', coachIds),
    teamIds.length > 0
      ? db.from('teams').select('id, name').in('id', teamIds)
      : { data: [] as { id: string; name: string }[] },
  ])

  const coachMap = new Map((coaches ?? []).map((c) => [c.id, c.display_name]))
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]))

  return invites.map((inv) => ({
    id: inv.id,
    token: inv.token,
    invited_email: inv.invited_email,
    invited_user_id: inv.invited_user_id ?? null,
    invited_name: null,
    team_id: inv.team_id ?? null,
    team_name: inv.team_id ? (teamMap.get(inv.team_id) ?? null) : null,
    created_at: inv.created_at,
    expires_at: inv.expires_at,
    coach_name: coachMap.get(inv.invited_by) ?? null,
  }))
}

export async function getAthleteCoachInfo(athleteId: string): Promise<{
  coach: { id: string; display_name: string | null; linked_at: string } | null
  team: { id: string; name: string; coach_name: string | null; joined_at: string } | null
}> {
  const db = createServiceClient()

  const [{ data: link }, { data: membership }] = await Promise.all([
    db.from('coach_athlete_links')
      .select('id, coach_id, created_at')
      .eq('athlete_id', athleteId)
      .maybeSingle(),
    db.from('team_members')
      .select('id, team_id, joined_at')
      .eq('athlete_id', athleteId)
      .maybeSingle(),
  ])

  let coach = null
  if (link) {
    const { data: coachProfile } = await db
      .from('user_profiles')
      .select('id, display_name')
      .eq('id', link.coach_id)
      .single()
    coach = { id: link.coach_id, display_name: coachProfile?.display_name ?? null, linked_at: link.created_at }
  }

  let team = null
  if (membership) {
    const { data: teamData } = await db
      .from('teams')
      .select('id, name, coach_id')
      .eq('id', membership.team_id)
      .single()
    if (teamData) {
      const { data: coachProfile } = await db
        .from('user_profiles')
        .select('display_name')
        .eq('id', teamData.coach_id)
        .single()
      team = {
        id: teamData.id,
        name: teamData.name,
        coach_name: coachProfile?.display_name ?? null,
        joined_at: membership.joined_at,
      }
    }
  }

  return { coach, team }
}
