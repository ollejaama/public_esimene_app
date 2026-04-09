import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

// Anon browser client. RLS blocks all direct access; this is only
// used if we ever need to call Supabase directly from the browser.
export function createBrowserClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  client = createClient(url, key)
  return client
}
