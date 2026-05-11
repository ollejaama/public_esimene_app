import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'training_session'

// Lightweight Edge-compatible session check.
// Full jose JWS verification works in Edge — only JWE (encryption) needs Node.js APIs.
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const role = (payload as Record<string, unknown>).role ?? 'athlete'
    if (role === 'coach' && req.nextUrl.pathname.startsWith('/settings')) {
      return NextResponse.redirect(new URL('/home', req.url))
    }
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export const config = {
  matcher: [
    '/home/:path*',
    '/statistics/:path*',
    '/activities/:path*',
    '/settings/:path*',
    '/plan/:path*',
    '/compare/:path*',
  ],
}
