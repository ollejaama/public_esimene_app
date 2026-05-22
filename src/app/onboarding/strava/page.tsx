import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Connect Strava — Atlas' }

export default async function OnboardingStravaPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = createServiceClient()
  const { data: stravaProfile } = await db
    .from('profiles')
    .select('strava_athlete_id')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (stravaProfile) redirect('/onboarding/hr-zones')

  const error = searchParams.error
  const errorMessages: Record<string, string> = {
    strava_denied: 'Strava authorization was denied. Please try again.',
    auth_failed: 'Something went wrong. Please try again.',
  }

  return (
    <div className="w-full max-w-sm">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-atlas-muted mb-8">
        Atlas · Step 2 of 3
      </p>

      <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-atlas-ink mb-1">
        Connect Strava
      </h1>
      <p className="font-sans text-[13px] text-atlas-muted mb-8">
        Atlas will sync your training activities automatically.
        You can re-sync anytime from Settings.
      </p>

      {error && errorMessages[error] && (
        <div className="border border-[#a23b2a] px-4 py-3 mb-6">
          <p className="font-mono text-[11px] text-[#a23b2a]">{errorMessages[error]}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <a
          href="/api/auth/strava?next=/onboarding/hr-zones"
          className="inline-flex items-center justify-center gap-2.5 font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3.5 hover:opacity-85 transition-opacity"
          style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          Connect with Strava
        </a>

        <a
          href="/activities"
          className="text-center font-mono text-[11px] text-atlas-faint hover:text-atlas-muted transition-colors py-2"
        >
          Skip for now →
        </a>
      </div>
    </div>
  )
}
