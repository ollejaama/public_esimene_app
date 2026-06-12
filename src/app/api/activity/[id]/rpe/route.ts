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
  const rpe = body.rpe === null ? null : Number(body.rpe)

  if (rpe !== null && (!Number.isInteger(rpe) || rpe < 1 || rpe > 10)) {
    return NextResponse.json({ error: 'rpe must be 1–10 or null' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from('activities')
    .update({ rpe })
    .eq('id', params.id)
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
