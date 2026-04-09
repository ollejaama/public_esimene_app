import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { CUSTOM_SPORT_TAGS } from '@/lib/constants'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const tag = body.custom_sport_tag

  // Allow null to clear the tag, or validate it's one of the known values
  if (tag !== null && !CUSTOM_SPORT_TAGS.includes(tag)) {
    return NextResponse.json({ error: 'Invalid sport tag' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from('activities')
    .update({ custom_sport_tag: tag })
    .eq('id', params.id)
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
