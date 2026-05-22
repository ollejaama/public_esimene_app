'use client'

import { useEffect, useRef, useState } from 'react'

interface Team {
  id: string
  name: string
}

interface SearchResult {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface Props {
  teams: Team[]
  onClose: () => void
  onSuccess: () => void
}

export function InviteModal({ teams, onClose, onSuccess }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
      } catch {}
      setSearching(false)
    }, 300)
  }, [query])

  async function handleInvite() {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selected.id,
          teamId: selectedTeamId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to send invite')
      } else {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1200)
      }
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-atlas-ink/20">
      <div className="bg-atlas-bg border border-atlas-rule w-full max-w-sm shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-atlas-rule">
          <h2 className="font-serif text-[18px] text-atlas-ink">Invite athlete</h2>
          <button onClick={onClose} className="text-atlas-faint hover:text-atlas-ink transition-colors text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Search */}
          <div>
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted block mb-1.5">
              Search by name
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
              placeholder="Athlete name…"
              autoFocus
              className="w-full border border-atlas-rule bg-transparent font-sans text-[13px] text-atlas-ink px-3 py-2 outline-none focus:border-atlas-ink transition-colors"
            />
            {searching && (
              <p className="font-mono text-[10px] text-atlas-faint mt-1">Searching…</p>
            )}
            {!searching && results.length > 0 && !selected && (
              <div className="border border-atlas-rule border-t-0 max-h-40 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r); setQuery(r.display_name ?? '') }}
                    className="w-full text-left px-3 py-2 font-sans text-[13px] text-atlas-ink hover:bg-atlas-panel transition-colors border-b border-atlas-rule last:border-0"
                  >
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
            {!searching && query.length >= 2 && results.length === 0 && !selected && (
              <p className="font-mono text-[10px] text-atlas-faint mt-1">No athletes found</p>
            )}
          </div>

          {/* Team selector (optional) */}
          {teams.length > 0 && (
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted block mb-1.5">
                Add to team (optional)
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full border border-atlas-rule bg-transparent font-sans text-[13px] text-atlas-ink px-3 py-2 outline-none focus:border-atlas-ink transition-colors"
              >
                <option value="">Individual link only</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="font-mono text-[10px] text-[#a23b2a]">{error}</p>
          )}
          {success && (
            <p className="font-mono text-[10px] text-atlas-muted">Invite sent!</p>
          )}

          <button
            onClick={handleInvite}
            disabled={!selected || submitting}
            className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-4 py-2.5 hover:opacity-85 transition-opacity disabled:opacity-40"
            style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
          >
            {submitting ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
