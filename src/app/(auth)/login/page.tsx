'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Login failed')
      return
    }

    router.push(data.redirectTo)
    router.refresh()
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email address first')
      return
    }
    setError(null)
    await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setResetSent(true)
  }

  return (
    <main className="min-h-screen bg-atlas-bg flex items-center justify-center" style={{ padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-2">
          Atlas
        </p>
        <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.03em] text-atlas-ink mb-8">
          Sign <em>in</em>
        </h1>

        {error && (
          <p className="font-mono text-[11px] text-[#a23b2a] border border-[#a23b2a] px-4 py-2.5 mb-5">
            {error}
          </p>
        )}
        {resetSent && (
          <p className="font-mono text-[11px] text-atlas-muted border border-atlas-rule px-4 py-2.5 mb-5">
            Password reset link sent — check your email.
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-mono text-[10px] tracking-[0.1em] text-atlas-faint hover:text-atlas-muted transition-colors"
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent border border-atlas-rule text-atlas-ink font-sans text-[14px] px-3 py-2.5 focus:outline-none focus:border-atlas-ink"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="w-3.5 h-3.5 accent-atlas-ink"
            />
            <span className="font-mono text-[11px] text-atlas-muted">Keep me signed in</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3.5 transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: 'var(--atlas-ink)', color: 'var(--atlas-bg)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
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
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
          No account?{' '}
          <Link href="/signup" className="text-atlas-muted hover:text-atlas-ink transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
