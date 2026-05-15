import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db
    .from('lactate_measurements')
    .select('*')
    .eq('activity_id', params.id)
    .eq('user_id', session.userId)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const value_mmol = Number(body.value_mmol)
  if (isNaN(value_mmol) || value_mmol <= 0 || value_mmol > 30) {
    return NextResponse.json({ error: 'value_mmol must be a positive number ≤ 30' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('lactate_measurements')
    .insert({ activity_id: params.id, user_id: session.userId, value_mmol })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const measurementId = url.searchParams.get('measurementId')
  if (!measurementId) return NextResponse.json({ error: 'measurementId required' }, { status: 400 })

  const db = createServiceClient()
  await db
    .from('lactate_measurements')
    .delete()
    .eq('id', measurementId)
    .eq('user_id', session.userId)

  return NextResponse.json({ ok: true })
}
