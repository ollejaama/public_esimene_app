import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (!start || !end) return NextResponse.json({ error: 'start and end required' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('planned_rest_days')
    .select('*')
    .eq('user_id', session.userId)
    .gte('date', start)
    .lt('date', end)
    .order('date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await req.json()
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('planned_rest_days')
    .upsert({ user_id: session.userId, date }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
