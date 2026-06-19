import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Team name required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('teams')
    .insert({ coach_id: session.userId, name: name.trim() })
    .select('id')
    .single()

  if (error) {
    console.error('Team insert error:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }

  return NextResponse.json({ teamId: data.id })
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = createServiceClient()
  const { data: teams } = await db
    .from('teams')
    .select('id, name, created_at')
    .eq('coach_id', session.userId)
    .order('created_at', { ascending: true })

  return NextResponse.json(teams ?? [])
}
