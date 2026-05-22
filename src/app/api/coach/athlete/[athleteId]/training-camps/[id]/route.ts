import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { coachCanViewAthlete } from '@/lib/coach'

export async function PUT(
  req: NextRequest,
  { params }: { params: { athleteId: string; id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const hasAccess = await coachCanViewAthlete(session.userId, params.athleteId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, start_date, end_date, notes } = await req.json()

  const db = createServiceClient()
  const { data, error } = await db
    .from('training_camps')
    .update({ name, start_date, end_date, notes: notes || null })
    .eq('id', params.id)
    .eq('user_id', params.athleteId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { athleteId: string; id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const hasAccess = await coachCanViewAthlete(session.userId, params.athleteId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const { error } = await db
    .from('training_camps')
    .delete()
    .eq('id', params.id)
    .eq('user_id', params.athleteId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
