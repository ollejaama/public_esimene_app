import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request: req })

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

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = user.user_metadata?.role ?? 'athlete'
  if (role === 'coach' && req.nextUrl.pathname.startsWith('/settings')) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  return response
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
  ],
}
