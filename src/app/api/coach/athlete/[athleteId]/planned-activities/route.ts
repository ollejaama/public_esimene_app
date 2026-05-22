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

  const body = await req.json()
  const { date, sport_type, duration_minutes, description, time_of_day, intensity_type } = body

  if (!date || !sport_type || duration_minutes == null) {
    return NextResponse.json({ error: 'date, sport_type, duration_minutes required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('planned_activities')
    .insert({
      user_id: params.athleteId,
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
