import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db
    .from('user_settings')
    .select('*')
    .eq('user_id', session.userId)
    .maybeSingle()

  return NextResponse.json(data ?? {
    show_rpe: false, rpe_scale: 'rpe', show_lactate: false, theme: 'light',
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = createServiceClient()

  const { error } = await db.from('user_settings').upsert(
    {
      user_id: session.userId,
      show_rpe: body.show_rpe ?? false,
      rpe_scale: body.rpe_scale ?? 'rpe',
      show_lactate: body.show_lactate ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Lightweight patch for a single field — used by the theme toggle
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.theme || !['light', 'dark'].includes(body.theme)) {
    return NextResponse.json({ error: 'Invalid theme value' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('user_settings').upsert(
    { user_id: session.userId, theme: body.theme, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
