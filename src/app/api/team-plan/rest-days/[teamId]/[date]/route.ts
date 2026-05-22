import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string; date: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()

  const { data: team } = await db
    .from('teams')
    .select('id')
    .eq('id', params.teamId)
    .eq('coach_id', session.userId)
    .maybeSingle()

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { error } = await db
    .from('team_planned_rest_days')
    .delete()
    .eq('team_id', params.teamId)
    .eq('date', params.date)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
