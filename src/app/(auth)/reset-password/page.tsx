import { resetPassword } from '../actions'

export const metadata = { title: 'Set new password — Atlas' }

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams.error

  return (
    <div className="w-full max-w-sm">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-atlas-muted mb-8">
        Atlas
      </p>

      <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-atlas-ink mb-1">
        Set new password
      </h1>
      <p className="font-sans text-[13px] text-atlas-muted mb-8">
        Choose a new password for your Atlas account.
      </p>

      {error && (
        <div className="border border-[#a23b2a] px-4 py-3 mb-6">
          <p className="font-mono text-[11px] text-[#a23b2a]">{decodeURIComponent(error)}</p>
        </div>
      )}

      <form action={resetPassword} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted"
          >
            New password
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

        <button
          type="submit"
          className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-4 py-3 mt-1 hover:opacity-85 transition-opacity"
          style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
        >
          Update password
        </button>
      </form>
    </div>
  )
}
