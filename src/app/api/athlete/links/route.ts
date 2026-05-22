import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

// Athlete removes their own coach link or leaves a team
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'athlete') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { linkType, coachId, teamId } = body as {
    linkType: 'coach' | 'team'
    coachId?: string
    teamId?: string
  }

  const db = createServiceClient()

  if (linkType === 'coach' && coachId) {
    const { error } = await db
      .from('coach_athlete_links')
      .delete()
      .eq('athlete_id', session.userId)
      .eq('coach_id', coachId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (linkType === 'team' && teamId) {
    const { error } = await db
      .from('team_members')
      .delete()
      .eq('athlete_id', session.userId)
      .eq('team_id', teamId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
