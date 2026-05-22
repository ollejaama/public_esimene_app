import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const { data: invite } = await db
    .from('invites')
    .select('id, invited_user_id, invited_email, invited_by, accepted_at, expires_at')
    .eq('token', params.token)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  if (invite.accepted_at) return NextResponse.json({ error: 'Already accepted' }, { status: 409 })
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
  }

  // Verify invite is for this user
  const { data: authUser } = await db.auth.admin.getUserById(session.userId)
  const userEmail = authUser.user?.email ?? ''
  const isForThisUser =
    invite.invited_user_id === session.userId ||
    invite.invited_email.toLowerCase() === userEmail.toLowerCase()

  if (!isForThisUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Mark the notification as read and delete the invite
  if (invite.invited_user_id) {
    await db
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', invite.invited_user_id)
      .filter('payload->>inviteId', 'eq', invite.id)
  }

  // Notify coach of decline
  const { data: athleteProfile } = await db
    .from('user_profiles')
    .select('display_name')
    .eq('id', session.userId)
    .single()

  await db.from('notifications').insert({
    user_id: invite.invited_by,
    type: 'invite_declined',
    payload: {
      athleteId: session.userId,
      athleteName: athleteProfile?.display_name ?? 'An athlete',
    },
  })

  // Delete the invite
  await db.from('invites').delete().eq('id', invite.id)

  return NextResponse.json({ ok: true })
}
