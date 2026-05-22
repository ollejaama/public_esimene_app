import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

async function verifyCoachOwnsCamp(db: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>, campId: string, coachId: string) {
  const { data: camp } = await db.from('team_training_camps').select('team_id').eq('id', campId).maybeSingle()
  if (!camp) return null
  const { data: team } = await db.from('teams').select('id').eq('id', camp.team_id).eq('coach_id', coachId).maybeSingle()
  return team ? camp : null
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const camp = await verifyCoachOwnsCamp(db, params.id, session.userId)
  if (!camp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, start_date, end_date, notes } = await req.json()
  const { data, error } = await db
    .from('team_training_camps')
    .update({ name, start_date, end_date, notes: notes || null })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const camp = await verifyCoachOwnsCamp(db, params.id, session.userId)
  if (!camp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await db.from('team_training_camps').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
