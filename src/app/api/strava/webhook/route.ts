import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServiceClient } from '@/lib/supabase/server'
import { syncSingleActivity, deleteStravaActivity } from '@/lib/sync/syncActivity'

// Give background processing enough time to fetch streams and laps for one activity.
export const maxDuration = 60

interface WebhookEvent {
  object_type: 'activity' | 'athlete'
  aspect_type: 'create' | 'update' | 'delete'
  object_id: number
  owner_id: number       // Strava athlete ID
  subscription_id: number
  event_time: number
  updates?: Record<string, string>
}

// GET — Strava subscription verification handshake.
// Strava sends: hub.mode, hub.verify_token, hub.challenge
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('hub.mode')
  const verifyToken = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && verifyToken === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — Strava pushes activity and athlete events here.
// Return 200 immediately; process in background via waitUntil.
export async function POST(req: NextRequest): Promise<NextResponse> {
  let event: WebhookEvent
  try {
    event = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  waitUntil(handleEvent(event))
  return NextResponse.json({ ok: true })
}

async function handleEvent(event: WebhookEvent): Promise<void> {
  const db = createServiceClient()

  // Athlete deauthorisation: clear stored tokens so the cron skips them.
  if (event.object_type === 'athlete' && event.aspect_type === 'update' && event.updates?.authorized === 'false') {
    await db
      .from('profiles')
      .update({
        strava_access_token: '',
        strava_refresh_token: '',
      })
      .eq('strava_athlete_id', event.owner_id)
    return
  }

  if (event.object_type !== 'activity') return

  // Resolve our internal user ID from the Strava athlete ID.
  const { data: profile } = await db
    .from('profiles')
    .select('user_id')
    .eq('strava_athlete_id', event.owner_id)
    .maybeSingle()

  if (!profile) return // Athlete is not one of our users

  const { user_id: userId } = profile

  try {
    switch (event.aspect_type) {
      case 'create':
      case 'update':
        // Re-fetching the full activity covers both creates and metadata updates.
        await syncSingleActivity(userId, event.object_id)
        break
      case 'delete':
        await deleteStravaActivity(userId, event.object_id)
        break
    }
  } catch (err) {
    // Log but don't throw — Strava retries on non-2xx, and we already returned 200.
    console.error(`Webhook processing failed for athlete ${event.owner_id}:`, err)
  }
}
