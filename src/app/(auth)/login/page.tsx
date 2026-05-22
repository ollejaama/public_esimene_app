import Link from 'next/link'
import { login } from '../actions'
import { OAuthButtons } from '../OAuthButtons'

export const metadata = { title: 'Sign in — Atlas' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; reset?: string }
}) {
  const error = searchParams.error
  const didReset = searchParams.reset === 'true'

  return (
    <div className="w-full max-w-sm">
      {/* Wordmark */}
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-atlas-muted mb-8">
        Atlas
      </p>

      <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-atlas-ink mb-1">
        Sign in
      </h1>
      <p className="font-sans text-[13px] text-atlas-muted mb-8">
        Don&rsquo;t have an account?{' '}
        <Link href="/signup" className="text-atlas-ink underline underline-offset-2">
          Sign up
        </Link>
      </p>

      {didReset && (
        <div className="border border-atlas-rule bg-atlas-panel px-4 py-3 mb-6">
          <p className="font-sans text-[13px] text-atlas-ink">
            Password updated. You can sign in with your new password.
          </p>
        </div>
      )}

      {error && (
        <div className="border border-[#a23b2a] px-4 py-3 mb-6">
          <p className="font-mono text-[11px] text-[#a23b2a]">{decodeURIComponent(error)}</p>
        </div>
      )}

      <form action={login} className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="border border-atlas-rule bg-transparent font-sans text-[13px] text-atlas-ink px-3 py-2.5 outline-none focus:border-atlas-ink transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <label
              htmlFor="password"
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-mono text-[10px] text-atlas-faint hover:text-atlas-muted transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="border border-atlas-rule bg-transparent font-sans text-[13px] text-atlas-ink px-3 py-2.5 outline-none focus:border-atlas-ink transition-colors"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="keepSignedIn"
            defaultChecked
            className="accent-atlas-accent"
          />
          <span className="font-sans text-[13px] text-atlas-muted">Keep me signed in</span>
        </label>

        <button
          type="submit"
          className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-4 py-3 mt-1 hover:opacity-85 transition-opacity"
          style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
        >
          Sign in
        </button>
      </form>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-atlas-rule" />
        <span className="font-mono text-[10px] text-atlas-faint">or</span>
        <div className="flex-1 h-px bg-atlas-rule" />
      </div>

      <OAuthButtons />
    </div>
  )
}
