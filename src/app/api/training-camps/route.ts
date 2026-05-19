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
    .from('training_camps')
    .select('*')
    .eq('user_id', session.userId)
    .lte('start_date', end)
    .gte('end_date', start)
    .order('start_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, start_date, end_date, notes } = await req.json()
  if (!name || !start_date || !end_date) {
    return NextResponse.json({ error: 'name, start_date, end_date required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('training_camps')
    .insert({ user_id: session.userId, name, start_date, end_date, notes: notes || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
