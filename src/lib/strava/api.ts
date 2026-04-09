import { createServiceClient } from '@/lib/supabase/server'
import { refreshToken } from './auth'
import { StravaActivity, StravaStream } from './types'

const STRAVA_API = 'https://www.strava.com/api/v3'

// Wraps any Strava API call with automatic token refresh.
// Returns the access token to use, after refreshing if needed.
export async function getValidAccessToken(userId: string): Promise<string> {
  const db = createServiceClient()
  const { data: profile, error } = await db
    .from('profiles')
    .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
    .eq('user_id', userId)
    .single()

  if (error || !profile) throw new Error('Profile not found')

  // Refresh if expiring within 5 minutes
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (profile.strava_token_expires_at < nowSeconds + 300) {
    const refreshed = await refreshToken(profile.strava_refresh_token)
    await db
      .from('profiles')
      .update({
        strava_access_token: refreshed.access_token,
        strava_refresh_token: refreshed.refresh_token,
        strava_token_expires_at: refreshed.expires_at,
      })
      .eq('user_id', userId)
    return refreshed.access_token
  }

  return profile.strava_access_token
}

export interface ActivitiesPage {
  activities: StravaActivity[]
  rateLimitUsage: number   // requests used in current 15-min window
  rateLimitLimit: number
}

export async function getActivities(
  accessToken: string,
  options: { after?: number; page?: number; perPage?: number } = {}
): Promise<ActivitiesPage> {
  const params = new URLSearchParams({
    per_page: String(options.perPage ?? 50),
    page: String(options.page ?? 1),
  })
  if (options.after) params.set('after', String(options.after))

  const res = await fetch(`${STRAVA_API}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Strava activities fetch failed: ${res.status}`)
  }

  const rateLimitUsage = parseInt(res.headers.get('X-RateLimit-Usage')?.split(',')[0] ?? '0')
  const rateLimitLimit = parseInt(res.headers.get('X-RateLimit-Limit')?.split(',')[0] ?? '100')
  const activities: StravaActivity[] = await res.json()

  return { activities, rateLimitUsage, rateLimitLimit }
}

export async function getHRStream(
  accessToken: string,
  activityId: number
): Promise<number[] | null> {
  const res = await fetch(
    `${STRAVA_API}/activities/${activityId}/streams?keys=heartrate&key_by_type=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`HR stream fetch failed: ${res.status}`)

  const data = await res.json()
  return (data.heartrate?.data as number[]) ?? null
}

export async function getGPSStream(
  accessToken: string,
  activityId: number
): Promise<[number, number][] | null> {
  const res = await fetch(
    `${STRAVA_API}/activities/${activityId}/streams?keys=latlng&key_by_type=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GPS stream fetch failed: ${res.status}`)

  const data = await res.json()
  return (data.latlng?.data as [number, number][]) ?? null
}
