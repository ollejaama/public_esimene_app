import { NextRequest, NextResponse } from 'next/server'
import { createSSRClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createSSRClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  const role = data.user?.user_metadata?.role ?? 'athlete'
  const redirectTo = role === 'coach' ? '/coach' : '/home'

  return NextResponse.json({ redirectTo })
}
