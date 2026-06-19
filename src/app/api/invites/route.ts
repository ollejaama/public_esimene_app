import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient, createSSRClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { athleteId, teamId } = await req.json()
  if (!athleteId) {
    return NextResponse.json({ error: 'athleteId required' }, { status: 400 })
  }

  const db = createServiceClient()

  // Check not already linked
  const { data: existing } = await db
    .from('coach_athlete_links')
    .select('athlete_id')
    .eq('coach_id', session.userId)
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already linked' }, { status: 409 })
  }

  // Get athlete profile (need email for invite)
  const { data: athleteProfile } = await db
    .from('profiles')
    .select('email, display_name')
    .eq('user_id', athleteId)
    .maybeSingle()

  if (!athleteProfile?.email) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  // Get coach display_name
  const { data: coachProfile } = await db
    .from('profiles')
    .select('display_name')
    .eq('user_id', session.userId)
    .maybeSingle()

  const coachName = coachProfile?.display_name ?? 'Your coach'

  // Get team name if teamId provided
  let teamName: string | null = null
  if (teamId) {
    const { data: team } = await db
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .eq('coach_id', session.userId)
      .maybeSingle()
    teamName = team?.name ?? null
  }

  // Create invite
  const { data: invite, error: inviteError } = await db
    .from('invites')
    .insert({
      coach_id: session.userId,
      invitee_email: athleteProfile.email,
      team_id: teamId ?? null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (inviteError || !invite) {
    console.error('Invite insert error:', inviteError)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }

  // Create in-app notification for athlete
  await db.from('notifications').insert({
    user_id: athleteId,
    type: 'coach_invite',
    payload: {
      inviteId: invite.id,
      coachId: session.userId,
      coachName,
      teamId: teamId ?? null,
      teamName,
    },
  })

  // Send email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://puusette.com'
  sendInviteEmail(athleteProfile.email, coachName, teamName, appUrl).catch(() => {})

  return NextResponse.json({ inviteId: invite.id })
}
