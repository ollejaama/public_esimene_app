import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const db = createServiceClient()

  // Lightweight change-detection poll used by PlanRefresher
  if (searchParams.get('check') === '1') {
    const [{ data }, { count }] = await Promise.all([
      db
        .from('planned_activities')
        .select('updated_at')
        .eq('user_id', session.userId)
        .order('updated_at', { ascending: false })
        .limit(1),
      db
        .from('planned_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.userId),
    ])
    return NextResponse.json({ latestAt: data?.[0]?.updated_at ?? null, count: count ?? 0 })
  }

  const weekStart = searchParams.get('weekStart')
  const weekEnd = searchParams.get('weekEnd')

  if (!weekStart || !weekEnd) {
    return NextResponse.json({ error: 'weekStart and weekEnd required' }, { status: 400 })
  }

  const { data, error } = await db
    .from('planned_activities')
    .select('*')
    .eq('user_id', session.userId)
    .gte('date', weekStart)
    .lt('date', weekEnd)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, sport_type, duration_minutes, description, time_of_day, intensity_type } = body

  if (!date || !sport_type || duration_minutes == null) {
    return NextResponse.json({ error: 'date, sport_type, duration_minutes required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('planned_activities')
    .insert({
      user_id: session.userId,
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
