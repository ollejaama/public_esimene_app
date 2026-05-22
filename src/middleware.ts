import { createServerClient } from '@supabase/ssr'
import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const LEGACY_COOKIE = 'training_session'

// Lightweight check of the legacy JWT cookie (still set for backward compat).
async function getLegacyRole(req: NextRequest): Promise<'athlete' | 'coach' | null> {
  const token = req.cookies.get(LEGACY_COOKIE)?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return ((payload as Record<string, unknown>).role as 'athlete' | 'coach') ?? 'athlete'
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request: req })

  // --- Primary: Supabase Auth session ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const role = (user.user_metadata?.role as string | undefined) ?? 'athlete'
    if (role === 'coach' && req.nextUrl.pathname.startsWith('/settings')) {
      return NextResponse.redirect(new URL('/coach', req.url))
    }
    return response
  }

  // --- Fallback: legacy JWT cookie (Strava-only users, backward compat) ---
  const legacyRole = await getLegacyRole(req)
  if (legacyRole) {
    if (legacyRole === 'coach' && req.nextUrl.pathname.startsWith('/settings')) {
      return NextResponse.redirect(new URL('/coach', req.url))
    }
    return response
  }

  // Not authenticated — redirect to login
  return NextResponse.redirect(new URL('/login', req.url))
}

export const config = {
  matcher: [
    '/home/:path*',
    '/statistics/:path*',
    '/activities/:path*',
    '/settings/:path*',
    '/plan/:path*',
    '/compare/:path*',
    '/coach/:path*',
    '/calendar/:path*',
    '/onboarding',
    '/onboarding/:path*',
  ],
}
