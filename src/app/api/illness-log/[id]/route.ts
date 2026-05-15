import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const update: Record<string, unknown> = {}
  if (body.category !== undefined) {
    if (!['sick', 'injured', 'fatigue'].includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    update.category = body.category
  }
  if (body.start_date !== undefined) update.start_date = body.start_date
  if (body.end_date !== undefined) update.end_date = body.end_date
  if (body.notes !== undefined) update.notes = body.notes ?? null

  const db = createServiceClient()
  const { error } = await db
    .from('illness_log')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  await db
    .from('illness_log')
    .delete()
    .eq('id', params.id)
    .eq('user_id', session.userId)

  return NextResponse.json({ ok: true })
}
