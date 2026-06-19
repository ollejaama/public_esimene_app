'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function OnboardingForm({ role }: { role: 'athlete' | 'coach' }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/profile/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    if (role === 'coach') {
      router.push('/coach')
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div>
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-2">
          Step 2 of 2
        </p>
        <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.03em] text-atlas-ink mb-4">
          Connect <em>Strava</em>
        </h1>
        <p className="font-sans text-[14px] leading-[1.55] text-atlas-muted mb-8">
          Link your Strava account to start syncing activities and viewing your training data.
        </p>
        <a
          href="/api/auth/strava"
          className="inline-flex items-center font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3.5 hover:opacity-85 transition-opacity"
          style={{ background: '#FC4C02', color: '#fff' }}
        >
          Connect with Strava →
        </a>
        <p className="font-mono text-[11px] text-atlas-faint mt-6">
          You can also do this later from Settings.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-2">
        {role === 'coach' ? 'Step 1 of 1' : 'Step 1 of 2'}
      </p>
      <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.03em] text-atlas-ink mb-8">
        What should we <em>call you?</em>
      </h1>

      {error && (
        <p className="font-mono text-[11px] text-[#a23b2a] border border-[#a23b2a] px-4 py-2.5 mb-5">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-1.5">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Olle Jaama"
            className="w-full bg-transparent border border-atlas-rule text-atlas-ink font-sans text-[14px] px-3 py-2.5 focus:outline-none focus:border-atlas-ink"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3.5 transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: 'var(--atlas-ink)', color: 'var(--atlas-bg)' }}
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
