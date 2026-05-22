import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { sport_type, duration_minutes, description, date, time_of_day, intensity_type } = body

  const db = createServiceClient()

  // Verify coach owns the team that owns this activity
  const { data: existing } = await db
    .from('team_planned_activities')
    .select('team_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: team } = await db
    .from('teams')
    .select('id')
    .eq('id', existing.team_id)
    .eq('coach_id', session.userId)
    .maybeSingle()

  if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await db
    .from('team_planned_activities')
    .update({
      ...(sport_type != null && { sport_type }),
      ...(duration_minutes != null && { duration_minutes: Number(duration_minutes) }),
      ...(description !== undefined && { description: description || null }),
      ...(date != null && { date }),
      ...(time_of_day != null && { time_of_day }),
      ...(intensity_type != null && { intensity_type }),
      updated_at: new Date().toISOString(),
    })
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

  const { data: existing } = await db
    .from('team_planned_activities')
    .select('team_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: team } = await db
    .from('teams')
    .select('id')
    .eq('id', existing.team_id)
    .eq('coach_id', session.userId)
    .maybeSingle()

  if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await db.from('team_planned_activities').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
