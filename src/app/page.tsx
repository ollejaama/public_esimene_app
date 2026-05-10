import Link from 'next/link'

export default function LandingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: Record<string, string> = {
    strava_denied: 'Strava authorization was denied.',
    auth_failed: 'Authentication failed. Please try again.',
    no_athlete: 'No athlete profile found. Please log in as an athlete first.',
  }
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] : null

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-8 px-4 max-w-sm w-full">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Training Analytics</h1>
          <p className="text-gray-500 text-base">Your personal training data, visualized.</p>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">{errorMessage}</p>
        )}

        <div className="space-y-3">
          {/* Athlete login */}
          <div className="border border-[#e5e5e5] rounded-xl p-5 text-left space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Athlete</p>
              <p className="text-xs text-gray-400 mt-0.5">Log in with your Strava account</p>
            </div>
            <Link
              href="/api/auth/strava"
              className="inline-flex items-center gap-2.5 bg-[#FC4C02] hover:bg-[#e04400] text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Connect with Strava
            </Link>
          </div>

          {/* Coach login */}
          <div className="border border-[#e5e5e5] rounded-xl p-5 text-left space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Coach</p>
              <p className="text-xs text-gray-400 mt-0.5">View-only access — no Strava account needed</p>
            </div>
            <Link
              href="/api/auth/coach"
              className="inline-flex items-center gap-2 border border-[#e5e5e5] text-gray-700 hover:bg-gray-50 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              Continue as coach
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
