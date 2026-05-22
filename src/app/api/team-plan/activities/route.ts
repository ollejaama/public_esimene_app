import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { teamId, date, sport_type, duration_minutes, description, time_of_day, intensity_type } = body

  if (!teamId || !date || !sport_type || duration_minutes == null) {
    return NextResponse.json({ error: 'teamId, date, sport_type, duration_minutes required' }, { status: 400 })
  }

  const db = createServiceClient()

  // Verify this coach owns the team
  const { data: team } = await db.from('teams').select('id').eq('id', teamId).eq('coach_id', session.userId).maybeSingle()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { data, error } = await db
    .from('team_planned_activities')
    .insert({
      team_id: teamId,
      date,
      sport_type,
      duration_minutes: Number(duration_minutes),
      description: description || null,
      time_of_day: time_of_day ?? 'morning',
      intensity_type: intensity_type ?? 'regular',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
