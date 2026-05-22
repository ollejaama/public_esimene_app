import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/resend'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const { data } = await db
    .from('invites')
    .select('*')
    .eq('invited_by', session.userId)
    .is('accepted_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { userId, email, teamId } = body as {
    userId?: string
    email?: string
    teamId?: string | null
  }

  if (!userId && !email) {
    return NextResponse.json({ error: 'userId or email required' }, { status: 400 })
  }

  const db = createServiceClient()

  // Resolve the invited athlete
  let invitedUserId: string | null = userId ?? null
  let invitedEmail: string = email ?? ''

  if (invitedUserId && !invitedEmail) {
    // Lookup email from auth admin
    try {
      const { data: authUser } = await db.auth.admin.getUserById(invitedUserId)
      invitedEmail = authUser.user?.email ?? ''
    } catch {
      return NextResponse.json({ error: 'Could not look up user email' }, { status: 500 })
    }
  }

  if (!invitedEmail) {
    return NextResponse.json({ error: 'Could not determine invite email' }, { status: 400 })
  }

  // Verify team belongs to this coach (if provided)
  let teamName: string | null = null
  if (teamId) {
    const { data: team } = await db.from('teams').select('name').eq('id', teamId).eq('coach_id', session.userId).maybeSingle()
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    teamName = team.name
  }

  // Prevent duplicate open invites
  const { data: existing } = await db
    .from('invites')
    .select('id')
    .eq('invited_by', session.userId)
    .eq('invited_email', invitedEmail)
    .is('accepted_at', null)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An open invite already exists for this person' }, { status: 409 })
  }

  // Fetch coach display_name for notification and email
  const { data: coachProfile } = await db
    .from('user_profiles')
    .select('display_name')
    .eq('id', session.userId)
    .single()
  const coachName = coachProfile?.display_name ?? 'Your coach'

  // Create invite
  const { data: invite, error: inviteErr } = await db
    .from('invites')
    .insert({
      invited_email: invitedEmail,
      invited_user_id: invitedUserId,
      invited_by: session.userId,
      team_id: teamId ?? null,
    })
    .select()
    .single()

  if (inviteErr || !invite) {
    return NextResponse.json({ error: inviteErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  // Create in-app notification for athlete (only if we know their userId)
  if (invitedUserId) {
    await db.from('notifications').insert({
      user_id: invitedUserId,
      type: teamId ? 'team_invite' : 'coach_invite',
      payload: {
        inviteId: invite.id,
        inviteToken: invite.token,
        coachId: session.userId,
        coachName,
        teamId: teamId ?? null,
        teamName,
      },
    })
  }

  // Send email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://atlas.training'
  await sendInviteEmail(invitedEmail, coachName, teamName, appUrl)

  return NextResponse.json(invite, { status: 201 })
}
