import Link from 'next/link'
import { signUp } from '../actions'
import { OAuthButtons } from '../OAuthButtons'

export const metadata = { title: 'Create account — Atlas' }

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams.error

  return (
    <div className="w-full max-w-sm">
      {/* Wordmark */}
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-atlas-muted mb-8">
        Atlas
      </p>

      <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-atlas-ink mb-1">
        Create account
      </h1>
      <p className="font-sans text-[13px] text-atlas-muted mb-8">
        Already have an account?{' '}
        <Link href="/login" className="text-atlas-ink underline underline-offset-2">
          Sign in
        </Link>
      </p>

      {error && (
        <div className="border border-[#a23b2a] px-4 py-3 mb-6">
          <p className="font-mono text-[11px] text-[#a23b2a]">{decodeURIComponent(error)}</p>
        </div>
      )}

      <form action={signUp} className="flex flex-col gap-4 mb-6">
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
          <label
            htmlFor="password"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className="border border-atlas-rule bg-transparent font-sans text-[13px] text-atlas-ink px-3 py-2.5 outline-none focus:border-atlas-ink transition-colors"
          />
          <p className="font-mono text-[10px] text-atlas-faint">Minimum 8 characters</p>
        </div>

        {/* Role selection */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            I am an
          </p>
          <div className="grid grid-cols-2 gap-2">
            <RoleOption value="athlete" label="Athlete" description="I train and sync Strava" defaultChecked />
            <RoleOption value="coach" label="Coach" description="I follow athletes" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-4 py-3 mt-1 hover:opacity-85 transition-opacity"
          style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
        >
          Create account
        </button>
      </form>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-atlas-rule" />
        <span className="font-mono text-[10px] text-atlas-faint">or</span>
        <div className="flex-1 h-px bg-atlas-rule" />
      </div>

      <OAuthButtons />

      <p className="font-mono text-[10px] text-atlas-faint mt-6 leading-[1.6]">
        By creating an account you agree to the{' '}
        <span className="text-atlas-muted">Terms of Service</span> and{' '}
        <span className="text-atlas-muted">Privacy Policy</span>.
      </p>
    </div>
  )
}

function RoleOption({
  value,
  label,
  description,
  defaultChecked,
}: {
  value: string
  label: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <label className="relative flex flex-col gap-1 border border-atlas-rule p-3 cursor-pointer has-[:checked]:border-atlas-ink has-[:checked]:bg-atlas-panel transition-colors">
      <input
        type="radio"
        name="role"
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      <span className="font-serif text-[15px] text-atlas-ink">{label}</span>
      <span className="font-sans text-[11px] text-atlas-muted leading-snug">{description}</span>
    </label>
  )
}
