import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()

  // Verify ownership before deleting
  const { data: invite } = await db
    .from('invites')
    .select('id, invited_user_id')
    .eq('id', params.inviteId)
    .eq('invited_by', session.userId)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Remove notification for the athlete if they had one
  if (invite.invited_user_id) {
    await db
      .from('notifications')
      .delete()
      .eq('user_id', invite.invited_user_id)
      .filter('payload->>inviteId', 'eq', params.inviteId)
  }

  await db.from('invites').delete().eq('id', params.inviteId)

  return NextResponse.json({ ok: true })
}
