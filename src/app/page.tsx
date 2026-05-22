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
    <main
      className="min-h-screen bg-atlas-bg"
      style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr' }}
    >
      {/* Left: editorial hero */}
      <div
        className="relative flex flex-col border-r border-atlas-rule"
        style={{ padding: '80px 64px 48px' }}
      >
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-9">
          Vol. IV — Season 2025/26
        </p>

        <h1 className="font-serif text-[88px] leading-[0.95] tracking-[-0.035em] text-atlas-ink">
          A quiet<br />
          <span className="italic text-atlas-accent">almanac</span><br />
          of training.
        </h1>

        <p
          className="font-sans text-[16px] leading-[1.55] text-atlas-muted mt-8"
          style={{ maxWidth: 440 }}
        >
          Your Strava activities, hand-pressed into a long-form log book.
          Read the season, mark the intervals, plan the next week.
        </p>

        {errorMessage && (
          <p className="font-mono text-[11px] text-[#a23b2a] border border-[#a23b2a] px-4 py-2.5 mt-6 w-fit">
            {errorMessage}
          </p>
        )}

        {/* Stats row pinned to bottom */}
        <div className="absolute bottom-14" style={{ left: 64, right: 64 }}>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-faint mb-3">
            Latest entry
          </p>
          <div className="flex gap-6 pt-4 border-t border-atlas-rule">
            {[
              ['142', 'sessions'],
              ['271h', 'this season'],
              ['12', 'day streak'],
              ['Z2', 'home zone'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-serif text-[36px] leading-none tracking-[-0.02em] text-atlas-ink">{n}</div>
                <div className="font-mono text-[11px] text-atlas-muted mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: sign-in cards */}
      <div className="flex flex-col gap-6" style={{ padding: '80px 64px' }}>
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-2">
          Sign in
        </p>

        {/* Athlete card */}
        <div className="bg-atlas-panel border border-atlas-rule" style={{ padding: 32 }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="font-mono text-[11px] tracking-[0.15em] text-atlas-faint">I.</span>
              <h3 className="font-serif text-[32px] leading-none tracking-[-0.02em] text-atlas-ink mt-1.5">
                The <em>athlete</em>
              </h3>
            </div>
            <span className="text-[22px] text-atlas-ink">↗</span>
          </div>
          <p className="font-sans text-[14px] leading-[1.5] text-atlas-muted mt-3 mb-7">
            Bring your Strava history. Activities will sync, sort themselves,
            and quietly accumulate into a season.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3.5 hover:opacity-85 transition-opacity"
              style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center font-sans text-[13px] text-atlas-muted hover:text-atlas-ink transition-colors"
            >
              Sign in →
            </Link>
          </div>
        </div>

        {/* Coach card */}
        <div className="border border-atlas-rule" style={{ padding: 32 }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="font-mono text-[11px] tracking-[0.15em] text-atlas-faint">II.</span>
              <h3 className="font-serif text-[32px] leading-none tracking-[-0.02em] text-atlas-ink mt-1.5">
                The <em>coach</em>
              </h3>
            </div>
            <span className="text-[22px] text-atlas-muted">→</span>
          </div>
          <p className="font-sans text-[14px] leading-[1.5] text-atlas-muted mt-3 mb-7">
            Read-only access. No Strava account required —
            follow your athlete&rsquo;s training as if you were turning pages.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center font-sans text-[13px] font-medium border border-atlas-ink text-atlas-ink px-5 py-3.5 hover:opacity-70 transition-opacity"
          >
            Sign in →
          </Link>
        </div>

        <div className="mt-auto font-mono text-[11px] tracking-[0.1em] text-atlas-faint">
          EDITION 1 · TALLINN, EST · MMXXV
        </div>
      </div>
    </main>
  )
}
