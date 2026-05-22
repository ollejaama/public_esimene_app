'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteAccountButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to delete account')
        setDeleting(false)
        return
      }
      router.push('/')
    } catch {
      setError('Network error')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-[#a23b2a] transition-colors"
      >
        Delete account
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="font-sans text-[13px] text-atlas-ink">
        This permanently deletes your account and all your data. There is no undo.
      </p>
      {error && <p className="font-mono text-[10px] text-[#a23b2a]">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#a23b2a] hover:opacity-70 transition-opacity disabled:opacity-40"
        >
          {deleting ? 'Deleting…' : 'Yes, delete everything'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-atlas-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
