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
  const contribution_hours = body.contribution_hours == null ? null : Number(body.contribution_hours)

  if (contribution_hours !== null && (isNaN(contribution_hours) || contribution_hours <= 0)) {
    return NextResponse.json({ error: 'contribution_hours must be a positive number or null' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from('activities')
    .update({ contribution_hours })
    .eq('id', params.id)
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
