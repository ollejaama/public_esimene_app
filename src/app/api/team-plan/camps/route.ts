import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { teamId, name, start_date, end_date, notes } = await req.json()
  if (!teamId || !name || !start_date || !end_date) {
    return NextResponse.json({ error: 'teamId, name, start_date, end_date required' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: team } = await db.from('teams').select('id').eq('id', teamId).eq('coach_id', session.userId).maybeSingle()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { data, error } = await db
    .from('team_training_camps')
    .insert({ team_id: teamId, name, start_date, end_date, notes: notes || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
