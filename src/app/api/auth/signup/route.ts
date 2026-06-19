import { NextRequest, NextResponse } from 'next/server'
import { createSSRClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { email, password, role } = await req.json()

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createSSRClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.user) {
    await sendWelcomeEmail(email, role as 'athlete' | 'coach')
  }

  return NextResponse.json({ success: true })
}
