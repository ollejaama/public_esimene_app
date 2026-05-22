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
    <main className="min-h-screen bg-atlas-bg flex flex-col">
      {/* Hero + auth cards */}
      <div className="flex flex-col lg:grid lg:flex-none" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
        {/* Left: editorial hero */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-atlas-rule px-8 py-14 lg:px-16 lg:py-20">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-8">
            Vol. IV — Season 2025/26
          </p>

          <h1 className="font-serif text-[60px] sm:text-[80px] lg:text-[88px] leading-[0.95] tracking-[-0.035em] text-atlas-ink">
            A quiet<br />
            <span className="italic text-atlas-accent">almanac</span><br />
            of training.
          </h1>

          <p className="font-sans text-[15px] lg:text-[16px] leading-[1.55] text-atlas-muted mt-8 max-w-md">
            Your Strava activities, hand-pressed into a long-form log book.
            Read the season, mark the intervals, plan the next week.
          </p>

          {errorMessage && (
            <p className="font-mono text-[11px] text-[#a23b2a] border border-[#a23b2a] px-4 py-2.5 mt-6 w-fit">
              {errorMessage}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-12 lg:mt-auto lg:pt-12">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-faint mb-3">
              Latest entry
            </p>
            <div className="flex flex-wrap gap-6 pt-4 border-t border-atlas-rule">
              {[
                ['142', 'sessions'],
                ['271h', 'this season'],
                ['12', 'day streak'],
                ['Z2', 'home zone'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-serif text-[32px] lg:text-[36px] leading-none tracking-[-0.02em] text-atlas-ink">{n}</div>
                  <div className="font-mono text-[11px] text-atlas-muted mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: sign-in cards */}
        <div className="flex flex-col gap-6 px-8 py-12 lg:px-16 lg:py-20">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-2">
            Sign in
          </p>

          {/* Athlete card */}
          <div className="bg-atlas-panel border border-atlas-rule p-7 lg:p-8">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[11px] tracking-[0.15em] text-atlas-faint">I.</span>
                <h3 className="font-serif text-[28px] lg:text-[32px] leading-none tracking-[-0.02em] text-atlas-ink mt-1.5">
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
          <div className="border border-atlas-rule p-7 lg:p-8">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[11px] tracking-[0.15em] text-atlas-faint">II.</span>
                <h3 className="font-serif text-[28px] lg:text-[32px] leading-none tracking-[-0.02em] text-atlas-ink mt-1.5">
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
      </div>

      {/* Features section */}
      <section className="border-t border-atlas-rule px-8 py-14 lg:px-16 lg:py-16">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-10">
          — What&rsquo;s inside
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {[
            {
              num: '01',
              title: 'Training log',
              body: 'Every Strava activity pulled in automatically. Sorted by week, labelled, and presented as a clean editorial record.',
            },
            {
              num: '02',
              title: 'Zone analytics',
              body: 'Heart-rate zones, session load, and weekly totals — charted over the full season so patterns become visible.',
            },
            {
              num: '03',
              title: 'Season planning',
              body: 'Build your week, month, and season plan in one place. Mark rest days, training camps, and target workouts.',
            },
            {
              num: '04',
              title: 'Coach view',
              body: 'Invite your coach. They see your full log and can plan your next block — no Strava account required on their end.',
            },
          ].map(({ num, title, body }) => (
            <div key={num}>
              <p className="font-mono text-[10px] tracking-[0.15em] text-atlas-faint mb-3">{num}</p>
              <h3 className="font-serif text-[20px] leading-none tracking-[-0.015em] text-atlas-ink mb-3">
                {title}
              </h3>
              <p className="font-sans text-[13px] leading-[1.6] text-atlas-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-atlas-rule px-8 py-14 lg:px-16 lg:py-16">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-10">
          — How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-16">
          {[
            {
              step: 'I',
              title: 'Create an account',
              body: 'Sign up in under a minute. Choose athlete or coach. No credit card needed.',
            },
            {
              step: 'II',
              title: 'Connect Strava',
              body: 'Authorize once and your full Strava history syncs instantly. New activities appear automatically.',
            },
            {
              step: 'III',
              title: 'Read your season',
              body: 'Browse the log, study the charts, and plan what comes next — all in one quiet, readable place.',
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex gap-5">
              <span className="font-serif italic text-[28px] leading-none text-atlas-accent flex-shrink-0 mt-0.5">
                {step}
              </span>
              <div>
                <h3 className="font-serif text-[18px] leading-none tracking-[-0.01em] text-atlas-ink mb-2.5">
                  {title}
                </h3>
                <p className="font-sans text-[13px] leading-[1.6] text-atlas-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center font-sans text-[13px] font-semibold tracking-[0.04em] px-6 py-3.5 hover:opacity-85 transition-opacity"
            style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
          >
            Get started — it&rsquo;s free
          </Link>
          <Link
            href="/login"
            className="font-sans text-[13px] text-atlas-muted hover:text-atlas-ink transition-colors"
          >
            Already have an account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-atlas-rule px-8 py-6 lg:px-16 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-faint">
          Atlas — Training Analytics
        </p>
        <p className="font-mono text-[10px] text-atlas-faint">
          EDITION 1 · TALLINN, EST · MMXXV
        </p>
      </footer>
    </main>
  )
}
