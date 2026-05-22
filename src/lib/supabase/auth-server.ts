import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// SSR-compatible Supabase client for Server Components and Server Actions.
// Reads and writes auth session cookies automatically.
export function createAuthServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies; only Server Actions and Route Handlers can.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  )
}
