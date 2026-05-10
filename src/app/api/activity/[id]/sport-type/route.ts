import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { SPORT_COLORS } from '@/lib/constants'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const overridden_sport_type = body.overridden_sport_type ?? null

  if (overridden_sport_type !== null && !(overridden_sport_type in SPORT_COLORS)) {
    return NextResponse.json({ error: 'Invalid sport type' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from('activities')
    .update({ overridden_sport_type })
    .eq('id', params.id)
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
