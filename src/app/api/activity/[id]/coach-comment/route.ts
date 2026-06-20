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

  // Get activity to find the athlete (owner) and verify coach-athlete link
  const { data: activity } = await db
    .from('activities')
    .select('user_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: link } = await db
    .from('coach_athlete_links')
    .select('athlete_id')
    .eq('coach_id', session.userId)
    .eq('athlete_id', activity.user_id)
    .maybeSingle()

  if (!link) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await db
    .from('activities')
    .update({
      coach_comment,
      coach_comment_at: coach_comment ? new Date().toISOString() : null,
      coach_comment_unread: coach_comment ? true : false,
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify athlete if comment was added (not cleared)
  if (coach_comment) {
    const { data: coachProfile } = await db
      .from('profiles')
      .select('display_name')
      .eq('user_id', session.userId)
      .maybeSingle()

    await db.from('notifications').insert({
      user_id: activity.user_id,
      type: 'coach_comment',
      payload: { activityId: params.id, coachName: coachProfile?.display_name ?? 'Your coach' },
    })
  }

  return NextResponse.json({ ok: true })
}
