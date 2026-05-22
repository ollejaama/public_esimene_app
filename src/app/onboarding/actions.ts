'use server'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function saveName(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const displayName = (formData.get('displayName') as string | null)?.trim()
  if (!displayName) redirect('/onboarding?error=name_required')

  const db = createServiceClient()
  await db.from('user_profiles').update({ display_name: displayName }).eq('id', session.userId)

  const { data: profile } = await db
    .from('user_profiles')
    .select('role')
    .eq('id', session.userId)
    .single()

  const role = profile?.role ?? session.role
  redirect(role === 'coach' ? '/coach' : '/onboarding/strava')
}
