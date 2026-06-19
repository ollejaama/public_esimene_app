'use client'

import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client for auth operations (login, signup, OAuth).
// Uses the anon key — safe to expose to the browser.
export function createSupabaseBrowserClient() {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
