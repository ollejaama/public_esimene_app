import Link from 'next/link'

export const metadata = { title: 'Verify email — Atlas' }

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm text-center">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-atlas-muted mb-8">
        Atlas
      </p>

      <div
        className="font-serif text-[48px] leading-none text-atlas-accent mb-6"
        aria-hidden="true"
      >
        ✉
      </div>

      <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-atlas-ink mb-3">
        Check your email
      </h1>
      <p className="font-sans text-[14px] leading-[1.55] text-atlas-muted mb-8">
        We sent a verification link to your email address. Click it to activate your account.
      </p>

      <p className="font-mono text-[11px] text-atlas-faint">
        Wrong address?{' '}
        <Link href="/signup" className="text-atlas-muted underline underline-offset-2">
          Back to sign up
        </Link>
      </p>
    </div>
  )
}
