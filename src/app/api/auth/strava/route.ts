import { NextRequest, NextResponse } from 'next/server'
import { buildStravaAuthUrl } from '@/lib/strava/auth'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const next = req.nextUrl.searchParams.get('next') ?? '/settings'
  const authUrl = buildStravaAuthUrl(next)
  return NextResponse.redirect(authUrl)
}
