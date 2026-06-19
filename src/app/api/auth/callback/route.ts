import { NextRequest, NextResponse } from 'next/server'
import { createSSRClient } from '@/lib/supabase/server'

// Supabase OAuth callback — handles Google and Apple sign-in redirects.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = createSSRClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const role = data.user.user_metadata?.role ?? 'athlete'
      const redirectTo = role === 'coach' ? '/coach' : next
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url))
}
