'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'
import { signSession } from '@/lib/session'
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/resend'

function makeSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
}

// Sets a backward-compat JWT cookie so existing Server Components that call
// getSession() keep working while the codebase is migrated to Supabase Auth.
async function setBridgeCookie(
  userId: string,
  role: 'athlete' | 'coach',
  persistent: boolean
) {
  const cookieStore = cookies()
  const token = await signSession({ userId, stravaAthleteId: 0, role })
  cookieStore.set('training_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    ...(persistent ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    path: '/',
  })
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const keepSignedIn = formData.get('keepSignedIn') === 'on'

  const supabase = makeSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  const user = data.user
  const role: 'athlete' | 'coach' =
    (user.user_metadata?.role as 'athlete' | 'coach') ?? 'athlete'

  // Ensure user_profiles row exists (e.g. for OAuth users who skip signup form)
  const db = createServiceClient()
  await db.from('user_profiles').upsert(
    {
      id: user.id,
      role,
      display_name: (user.user_metadata?.full_name as string | undefined) ?? email.split('@')[0],
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  await setBridgeCookie(user.id, role, keepSignedIn)
  redirect(role === 'coach' ? '/coach' : '/activities')
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = (formData.get('role') as string) || 'athlete'

  if (!['athlete', 'coach'].includes(role)) {
    redirect(`/signup?error=${encodeURIComponent('Invalid role selected')}`)
  }

  const supabase = makeSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/onboarding`,
      data: { role },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/verify-email')
}

export async function signOut() {
  const supabase = makeSupabaseClient()
  await supabase.auth.signOut()

  const cookieStore = cookies()
  cookieStore.set('training_session', '', { maxAge: 0, path: '/' })

  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  // Use the admin API to generate a password recovery link, then send
  // it via Resend instead of Supabase's built-in email.
  const db = createServiceClient()
  const { data } = await db.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`,
    },
  })

  if (data?.properties?.action_link) {
    await sendPasswordResetEmail(email, data.properties.action_link)
  }

  // Always redirect to the same success page — never reveal whether the email exists.
  redirect('/forgot-password?sent=true')
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string

  const supabase = makeSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?reset=true')
}
