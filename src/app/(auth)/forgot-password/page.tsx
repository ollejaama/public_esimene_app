import Link from 'next/link'
import { forgotPassword } from '../actions'

export const metadata = { title: 'Reset password — Atlas' }

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { sent?: string }
}) {
  const sent = searchParams.sent === 'true'

  return (
    <div className="w-full max-w-sm">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-atlas-muted mb-8">
        Atlas
      </p>

      <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-atlas-ink mb-1">
        Reset password
      </h1>
      <p className="font-sans text-[13px] text-atlas-muted mb-8">
        <Link href="/login" className="text-atlas-ink underline underline-offset-2">
          Back to sign in
        </Link>
      </p>

      {sent ? (
        <div className="border border-atlas-rule bg-atlas-panel px-4 py-5">
          <p className="font-sans text-[14px] text-atlas-ink mb-1">Email sent.</p>
          <p className="font-sans text-[13px] text-atlas-muted">
            Check your inbox for the reset link. It expires in 1 hour.
          </p>
        </div>
      ) : (
        <form action={forgotPassword} className="flex flex-col gap-4">
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

          <button
            type="submit"
            className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-4 py-3 mt-1 hover:opacity-85 transition-opacity"
            style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
          >
            Send reset link
          </button>
        </form>
      )}
    </div>
  )
}
