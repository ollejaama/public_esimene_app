'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete')
  const [terms, setTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!terms) {
      setError('Please accept the terms to continue')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Sign up failed')
      return
    }

    setDone(true)
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: { role },
      },
    })
  }

  if (done) {
    return (
      <main className="min-h-screen bg-atlas-bg flex items-center justify-center" style={{ padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-2">Atlas</p>
          <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.03em] text-atlas-ink mb-4">
            Check your <em>email</em>
          </h1>
          <p className="font-sans text-[14px] leading-[1.55] text-atlas-muted">
            We sent a verification link to <strong>{email}</strong>.
            Click it to activate your account, then{' '}
            <Link href="/login" className="text-atlas-ink underline underline-offset-2">sign in</Link>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-atlas-bg flex items-center justify-center" style={{ padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-2">
          Atlas
        </p>
        <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.03em] text-atlas-ink mb-8">
          Create an <em>account</em>
        </h1>

        {error && (
          <p className="font-mono text-[11px] text-[#a23b2a] border border-[#a23b2a] px-4 py-2.5 mb-5">
            {error}
          </p>
        )}

        {/* Role selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['athlete', 'coach'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="text-left border px-4 py-4 transition-colors"
              style={{
                borderColor: role === r ? 'var(--atlas-ink)' : 'var(--atlas-rule)',
                background: role === r ? 'var(--atlas-panel)' : 'transparent',
              }}
            >
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-faint mb-1">
                {r === 'athlete' ? 'I.' : 'II.'}
              </p>
              <p className="font-serif text-[20px] leading-none tracking-[-0.02em] text-atlas-ink">
                {r === 'athlete' ? <><em>Athlete</em></> : <><em>Coach</em></>}
              </p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border border-atlas-rule text-atlas-ink font-sans text-[14px] px-3 py-2.5 focus:outline-none focus:border-atlas-ink"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-1.5">
              Password <span className="text-atlas-faint normal-case tracking-normal">(min 8 chars)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-transparent border border-atlas-rule text-atlas-ink font-sans text-[14px] px-3 py-2.5 focus:outline-none focus:border-atlas-ink"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="w-3.5 h-3.5 accent-atlas-ink mt-0.5 flex-shrink-0"
            />
            <span className="font-mono text-[11px] text-atlas-muted">
              I agree to the terms of service
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3.5 transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: 'var(--atlas-ink)', color: 'var(--atlas-bg)' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-atlas-rule" />
          <span className="font-mono text-[10px] tracking-[0.1em] text-atlas-faint">or</span>
          <div className="flex-1 border-t border-atlas-rule" />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center gap-3 font-sans text-[13px] text-atlas-ink border border-atlas-rule px-4 py-3 hover:border-atlas-muted transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth('apple')}
            className="w-full flex items-center gap-3 font-sans text-[13px] text-atlas-ink border border-atlas-rule px-4 py-3 hover:border-atlas-muted transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.44c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 3.95zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <p className="font-mono text-[11px] text-atlas-faint mt-8 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-atlas-muted hover:text-atlas-ink transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
