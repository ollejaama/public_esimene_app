import { NextResponse } from 'next/server'
import { buildStravaAuthUrl } from '@/lib/strava/auth'

export async function GET(): Promise<NextResponse> {
  const authUrl = buildStravaAuthUrl()
  return NextResponse.redirect(authUrl)
}
