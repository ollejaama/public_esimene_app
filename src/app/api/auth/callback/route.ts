import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signSession } from '@/lib/session'
import { sendWelcomeEmail } from '@/lib/resend'

// Handles:
//   - Email verification after sign-up
//   - OAuth provider callbacks (Google, Apple)
//   - Password recovery redirects
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/activities'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url))
  }

  const response = NextResponse.redirect(new URL(next, req.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    return NextResponse.redirect(new URL('/login?error=verification_failed', req.url))
  }

  const role: 'athlete' | 'coach' =
    (user.user_metadata?.role as 'athlete' | 'coach') ?? 'athlete'

  // Create user_profiles row on first login; send welcome email once.
  const db = createServiceClient()
  const { data: existing } = await db
    .from('user_profiles')
    .select('id, welcome_sent')
    .eq('id', user.id)
    .single()

  if (!existing) {
    await db.from('user_profiles').insert({
      id: user.id,
      display_name:
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split('@')[0] ??
        'Athlete',
      role,
    })

    if (user.email) {
      await sendWelcomeEmail(user.email, role)
      await db.from('user_profiles').update({ welcome_sent: true }).eq('id', user.id)
    }
  }

  // Bridge cookie so existing Server Components using getSession() keep working.
  const token = await signSession({ userId: user.id, stravaAthleteId: 0, role })
  response.cookies.set('training_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return response
}
