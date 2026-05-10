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
  const { intensity_type } = body

  if (!['regular', 'interval', 'speed'].includes(intensity_type)) {
    return NextResponse.json({ error: 'Invalid intensity_type' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from('activities')
    .update({ intensity_type })
    .eq('id', params.id)
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
