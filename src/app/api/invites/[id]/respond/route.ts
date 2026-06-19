import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient, createSSRClient } from '@/lib/supabase/server'
import { sendInviteAcceptedEmail } from '@/lib/resend'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { action } = await req.json()
  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ error: 'action must be accept or decline' }, { status: 400 })
  }

  // Get the auth user's email to validate invite ownership
  const ssr = createSSRClient()
  const { data: { user } } = await ssr.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const db = createServiceClient()

  const { data: invite } = await db
    .from('invites')
    .select('*')
    .eq('id', params.id)
    .eq('invitee_email', user.email)
    .eq('status', 'pending')
    .maybeSingle()

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  // Update invite status
  await db
    .from('invites')
    .update({ status: action === 'accept' ? 'accepted' : 'declined' })
    .eq('id', params.id)

  if (action === 'accept') {
    // Link coach and athlete
    await db.from('coach_athlete_links').upsert(
      { coach_id: invite.coach_id, athlete_id: session.userId },
      { onConflict: 'coach_id,athlete_id' }
    )

    // Add to team if applicable
    if (invite.team_id) {
      await db.from('team_members').upsert(
        { team_id: invite.team_id, athlete_id: session.userId },
        { onConflict: 'team_id,athlete_id' }
      )
    }

    // Get athlete display_name and team name for notification/email
    const { data: athleteProfile } = await db
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', session.userId)
      .maybeSingle()

    let teamName: string | null = null
    if (invite.team_id) {
      const { data: team } = await db
        .from('teams')
        .select('name')
        .eq('id', invite.team_id)
        .maybeSingle()
      teamName = team?.name ?? null
    }

    const athleteName = athleteProfile?.display_name ?? 'An athlete'

    // Notify coach
    await db.from('notifications').insert({
      user_id: invite.coach_id,
      type: 'invite_accepted',
      payload: { athleteId: session.userId, athleteName, teamName },
    })

    // Email coach
    const { data: coachProfile } = await db
      .from('profiles')
      .select('email')
      .eq('user_id', invite.coach_id)
      .maybeSingle()

    if (coachProfile?.email) {
      sendInviteAcceptedEmail(coachProfile.email, athleteName, teamName).catch(() => {})
    }
  }

  return NextResponse.json({ success: true })
}
