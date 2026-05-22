import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { athleteId } = await req.json()
  if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

  const db = createServiceClient()

  // Verify the team belongs to this coach
  const { data: team } = await db
    .from('teams')
    .select('id')
    .eq('id', params.teamId)
    .eq('coach_id', session.userId)
    .maybeSingle()

  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await db
    .from('team_members')
    .delete()
    .eq('team_id', params.teamId)
    .eq('athlete_id', athleteId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
