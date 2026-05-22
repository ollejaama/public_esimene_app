import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { error } = await db.auth.admin.deleteUser(session.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Clear session cookies
  const response = NextResponse.json({ ok: true })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  )
  await supabase.auth.signOut()
  response.cookies.set('training_session', '', { httpOnly: true, sameSite: 'lax', maxAge: 0, path: '/' })

  return response
}
