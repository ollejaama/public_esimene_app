import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { sendInviteAcceptedEmail } from '@/lib/resend'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Lookup invite
  const { data: invite } = await db
    .from('invites')
    .select('*')
    .eq('token', params.token)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  if (invite.accepted_at) return NextResponse.json({ error: 'Already accepted' }, { status: 409 })
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
  }

  // Verify this invite is for the current user
  const { data: authUser } = await db.auth.admin.getUserById(session.userId)
  const userEmail = authUser.user?.email ?? ''

  const isForThisUser =
    invite.invited_user_id === session.userId ||
    invite.invited_email.toLowerCase() === userEmail.toLowerCase()

  if (!isForThisUser) {
    return NextResponse.json({ error: 'This invite is not for you' }, { status: 403 })
  }

  const athleteId = session.userId
  const coachId = invite.invited_by

  // Handle team invite
  if (invite.team_id) {
    // Check athlete isn't already in a different team
    const { data: existingMembership } = await db
      .from('team_members')
      .select('id, team_id')
      .eq('athlete_id', athleteId)
      .maybeSingle()

    if (existingMembership && existingMembership.team_id !== invite.team_id) {
      return NextResponse.json(
        { error: 'You are already a member of another team. Leave it first.' },
        { status: 409 }
      )
    }

    if (!existingMembership) {
      const { error: memberErr } = await db
        .from('team_members')
        .insert({ team_id: invite.team_id, athlete_id: athleteId })
      if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })
    }
  }

  // Create or ensure direct coach-athlete link exists
  const { data: existingLink } = await db
    .from('coach_athlete_links')
    .select('id')
    .eq('coach_id', coachId)
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (!existingLink) {
    const { error: linkErr } = await db
      .from('coach_athlete_links')
      .insert({ coach_id: coachId, athlete_id: athleteId })
    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })
  }

  // Mark invite accepted
  await db
    .from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  // Mark the athlete's invite notification as read
  await db
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', athleteId)
    .filter('payload->>inviteId', 'eq', invite.id)

  // Get athlete and team names for notification
  const [{ data: athleteProfile }, { data: teamData }] = await Promise.all([
    db.from('user_profiles').select('display_name').eq('id', athleteId).single(),
    invite.team_id
      ? db.from('teams').select('name').eq('id', invite.team_id).single()
      : { data: null },
  ])

  // Create notification for coach
  await db.from('notifications').insert({
    user_id: coachId,
    type: 'invite_accepted',
    payload: {
      athleteId,
      athleteName: athleteProfile?.display_name ?? 'An athlete',
      teamId: invite.team_id ?? null,
      teamName: teamData?.name ?? null,
    },
  })

  // Send email to coach
  try {
    const { data: coachAuth } = await db.auth.admin.getUserById(coachId)
    const coachEmail = coachAuth.user?.email
    if (coachEmail) {
      await sendInviteAcceptedEmail(
        coachEmail,
        athleteProfile?.display_name ?? 'An athlete',
        teamData?.name ?? null
      )
    }
  } catch {
    // Non-fatal: email failure doesn't roll back the acceptance
  }

  return NextResponse.json({ ok: true })
}
