import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const coach_comment = typeof body.coach_comment === 'string' ? body.coach_comment.trim() || null : null

  const db = createServiceClient()
  const { error } = await db
    .from('activities')
    .update({
      coach_comment,
      coach_comment_at: coach_comment ? new Date().toISOString() : null,
      coach_comment_unread: coach_comment ? true : false,
    })
    .eq('id', params.id)
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
