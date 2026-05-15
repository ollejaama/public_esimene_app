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
  return NextResponse.json({ ok: true })
}
