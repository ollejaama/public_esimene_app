import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SessionPayload } from '@/lib/supabase/types'

function makeSupabaseFromCookies(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — cookie writes handled by middleware
          }
        },
      },
    }
  )
}

// Read session from Next.js cookies() — for Server Components and Server Actions.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies()
  const supabase = makeSupabaseFromCookies(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return {
    userId: user.id,
    role: (user.user_metadata?.role ?? 'athlete') as 'athlete' | 'coach',
    stravaAthleteId: user.user_metadata?.strava_athlete_id ?? 0,
  }
}

// Read session from a NextRequest — for middleware and API routes.
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {
          // API route context — caller sets cookies on the response directly
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return {
    userId: user.id,
    role: (user.user_metadata?.role ?? 'athlete') as 'athlete' | 'coach',
    stravaAthleteId: user.user_metadata?.strava_athlete_id ?? 0,
  }
}
