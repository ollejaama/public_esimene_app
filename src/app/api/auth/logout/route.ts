import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/session'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.redirect(new URL('/', req.url))
  clearSessionCookie(res)
  return res
}
