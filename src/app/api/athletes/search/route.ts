import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const db = createServiceClient()

  // Get already-linked athlete IDs to exclude them
  const { data: linked } = await db
    .from('coach_athlete_links')
    .select('athlete_id')
    .eq('coach_id', session.userId)

  const linkedIds = (linked ?? []).map((r) => r.athlete_id)
  linkedIds.push(session.userId) // exclude self

  let query = db
    .from('profiles')
    .select('user_id, display_name')
    .eq('role', 'athlete')
    .ilike('display_name', `%${q}%`)
    .limit(10)

  if (linkedIds.length > 0) {
    query = query.not('user_id', 'in', `(${linkedIds.join(',')})`) as typeof query
  }

  const { data } = await query

  return NextResponse.json(
    (data ?? []).map((p) => ({ userId: p.user_id, displayName: p.display_name }))
  )
}
