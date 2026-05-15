import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const start = url.searchParams.get('start')  // 'YYYY-MM-DD'
  const end = url.searchParams.get('end')      // 'YYYY-MM-DD'

  const db = createServiceClient()
  let query = db
    .from('illness_log')
    .select('*')
    .eq('user_id', session.userId)
    .order('start_date', { ascending: true })

  if (start) query = query.lte('start_date', end!)   // entry starts before range end
  if (end)   query = query.gte('end_date', start!)   // entry ends after range start

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!['sick', 'injured', 'fatigue'].includes(body.category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (!body.start_date || !body.end_date) {
    return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('illness_log')
    .insert({
      user_id: session.userId,
      category: body.category,
      start_date: body.start_date,
      end_date: body.end_date,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
