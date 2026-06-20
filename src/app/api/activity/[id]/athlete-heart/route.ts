import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'athlete') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const athlete_heart = Boolean(body.athlete_heart)

  const db = createServiceClient()
  const { error } = await db
    .from('activities')
    .update({
      athlete_heart,
      athlete_heart_at: athlete_heart ? new Date().toISOString() : null,
      athlete_heart_unread: athlete_heart ? true : false,
    })
    .eq('id', params.id)
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the coach if heart was added (not removed)
  if (athlete_heart) {
    const [{ data: athleteProfile }, { data: coachLink }] = await Promise.all([
      db.from('profiles').select('display_name').eq('user_id', session.userId).maybeSingle(),
      db.from('coach_athlete_links').select('coach_id').eq('athlete_id', session.userId).maybeSingle(),
    ])

    if (coachLink) {
      await db.from('notifications').insert({
        user_id: coachLink.coach_id,
        type: 'athlete_heart',
        payload: { activityId: params.id, athleteName: athleteProfile?.display_name ?? 'Your athlete' },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
