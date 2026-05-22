import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getCoachAthletes } from '@/lib/coach'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const athletes = await getCoachAthletes(session.userId)
  return NextResponse.json(athletes)
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { athleteId } = await req.json()
  if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db
    .from('coach_athlete_links')
    .delete()
    .eq('coach_id', session.userId)
    .eq('athlete_id', athleteId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
