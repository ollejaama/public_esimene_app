import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { coachCanViewAthlete } from '@/lib/coach'

export async function POST(
  req: NextRequest,
  { params }: { params: { athleteId: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const hasAccess = await coachCanViewAthlete(session.userId, params.athleteId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { date } = await req.json()
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('planned_rest_days')
    .upsert({ user_id: params.athleteId, date }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
