'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function OnboardingContinue() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    setLoading(true)
    // Start initial sync in background, don't await completion
    fetch('/api/sync', { method: 'POST' }).catch(() => {})
    router.push('/activities')
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleContinue}
        disabled={loading}
        className="font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3 hover:opacity-85 transition-opacity disabled:opacity-50"
        style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
      >
        {loading ? 'Starting sync…' : 'Go to calendar →'}
      </button>
      <a
        href="/activities"
        className="font-mono text-[11px] text-atlas-faint hover:text-atlas-muted transition-colors"
      >
        Skip
      </a>
    </div>
  )
}
