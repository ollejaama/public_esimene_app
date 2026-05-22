import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { coachCanViewAthlete } from '@/lib/coach'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { athleteId: string; date: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const hasAccess = await coachCanViewAthlete(session.userId, params.athleteId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const { error } = await db
    .from('planned_rest_days')
    .delete()
    .eq('user_id', params.athleteId)
    .eq('date', params.date)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
