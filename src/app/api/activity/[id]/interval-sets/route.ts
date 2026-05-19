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
    .from('interval_sets')
    .select('*')
    .eq('activity_id', params.id)
    .eq('user_id', session.userId)
    .order('set_order')

  return NextResponse.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sets } = await req.json() as { sets: Array<{ reps: number; duration_secs: number; zone: string }> }

  const db = createServiceClient()

  await db.from('interval_sets').delete().eq('activity_id', params.id).eq('user_id', session.userId)

  if (sets.length > 0) {
    await db.from('interval_sets').insert(
      sets.map((s, i) => ({
        activity_id: params.id,
        user_id: session.userId,
        set_order: i,
        reps: s.reps,
        duration_secs: s.duration_secs,
        zone: s.zone,
      }))
    )
  }

  return NextResponse.json({ ok: true })
}
