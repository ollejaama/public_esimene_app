'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Athlete {
  userId: string
  displayName: string
  linkedAt: string
  teamName: string | null
}

interface Team {
  id: string
  name: string
  memberCount: number
}

export function CoachDashboard({
  initialAthletes,
  initialTeams,
}: {
  initialAthletes: Athlete[]
  initialTeams: Team[]
}) {
  const [athletes, setAthletes] = useState(initialAthletes)
  const [teams, setTeams] = useState(initialTeams)

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ userId: string; displayName: string }[]>([])
  const [searching, setSearching] = useState(false)

  // Invite state
  const [inviting, setInviting] = useState<string | null>(null)
  const [inviteTeamId, setInviteTeamId] = useState<string>('')
  const [inviteStatus, setInviteStatus] = useState<Record<string, 'sent' | 'error'>>({})

  // Team creation
  const [newTeamName, setNewTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 1) { setResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/athletes/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data)
    setSearching(false)
  }

  async function showAll() {
    setSearching(true)
    const res = await fetch('/api/athletes/search?q=')
    const data = await res.json()
    setResults(data)
    setSearching(false)
  }

  async function handleInvite(athleteId: string) {
    setInviting(athleteId)
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, teamId: inviteTeamId || undefined }),
    })
    setInviting(null)
    setInviteStatus((s) => ({ ...s, [athleteId]: res.ok ? 'sent' : 'error' }))
    if (res.ok) {
      setResults([])
      setQuery('')
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setCreatingTeam(true)
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTeamName.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setTeams((t) => [...t, { id: data.teamId, name: newTeamName.trim(), memberCount: 0 }])
      setNewTeamName('')
    }
    setCreatingTeam(false)
  }

  return (
    <div className="grid gap-8" style={{ gridTemplateColumns: '240px 1fr' }}>
      {/* Left: Teams */}
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-4">
          Teams
        </p>

        {teams.length === 0 && (
          <p className="font-serif italic text-[13px] text-atlas-faint mb-4">No teams yet.</p>
        )}

        <div className="space-y-2 mb-5">
          {teams.map((team) => (
            <div key={team.id} className="border border-atlas-rule bg-atlas-panel px-4 py-3">
              <p className="font-serif text-[16px] text-atlas-ink leading-tight">{team.name}</p>
              <p className="font-mono text-[10px] text-atlas-faint mt-0.5">
                {team.memberCount} {team.memberCount === 1 ? 'athlete' : 'athletes'}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateTeam} className="space-y-2">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="New team name"
            className="w-full bg-transparent border border-atlas-rule text-atlas-ink font-sans text-[13px] px-3 py-2 focus:outline-none focus:border-atlas-ink"
          />
          <button
            type="submit"
            disabled={creatingTeam || !newTeamName.trim()}
            className="w-full font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-2 border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors disabled:opacity-40"
          >
            {creatingTeam ? 'Creating…' : '+ Create team'}
          </button>
        </form>
      </div>

      {/* Right: Athletes */}
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-4">
          Search & invite athletes
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <div className="flex gap-2" style={{ maxWidth: 420 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name…"
              className="flex-1 bg-transparent border border-atlas-rule text-atlas-ink font-sans text-[14px] px-3 py-2.5 focus:outline-none focus:border-atlas-ink"
            />
            <button
              onClick={showAll}
              className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-2 border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors whitespace-nowrap"
            >
              Show all
            </button>
          </div>

          {teams.length > 0 && results.length > 0 && (
            <div className="mt-2" style={{ maxWidth: 420 }}>
              <label className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint mr-2">
                Invite to team:
              </label>
              <select
                value={inviteTeamId}
                onChange={(e) => setInviteTeamId(e.target.value)}
                className="bg-atlas-bg border border-atlas-rule font-sans text-[12px] text-atlas-ink px-2 py-1 focus:outline-none"
              >
                <option value="">Individual only</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {results.length > 0 && (
            <div className="absolute left-0 right-0 bg-atlas-panel border border-atlas-rule z-10 mt-1" style={{ maxWidth: 420 }}>
              {results.map((r) => (
                <div key={r.userId} className="flex items-center justify-between px-4 py-3 border-b border-atlas-rule last:border-0">
                  <span className="font-sans text-[13px] text-atlas-ink">{r.displayName}</span>
                  {inviteStatus[r.userId] === 'sent' ? (
                    <span className="font-mono text-[10px] text-atlas-muted">Invited</span>
                  ) : inviteStatus[r.userId] === 'error' ? (
                    <span className="font-mono text-[10px] text-[#a23b2a]">Error</span>
                  ) : (
                    <button
                      onClick={() => handleInvite(r.userId)}
                      disabled={inviting === r.userId}
                      className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 disabled:opacity-50 transition-opacity"
                      style={{ background: 'var(--atlas-ink)', color: 'var(--atlas-bg)' }}
                    >
                      {inviting === r.userId ? '…' : 'Invite'}
                    </button>
                  )}
                </div>
              ))}
              {searching && (
                <p className="font-mono text-[10px] text-atlas-faint px-4 py-3">Searching…</p>
              )}
            </div>
          )}
        </div>

        {/* Linked athletes */}
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-3">
          My athletes ({athletes.length})
        </p>

        {athletes.length === 0 ? (
          <p className="font-serif italic text-[15px] text-atlas-faint">
            No athletes linked yet. Search above to send an invite.
          </p>
        ) : (
          <div className="space-y-2">
            {athletes.map((a) => (
              <div key={a.userId} className="flex items-center justify-between border border-atlas-rule px-5 py-3">
                <div>
                  <p className="font-serif text-[16px] text-atlas-ink">{a.displayName}</p>
                  {a.teamName && (
                    <p className="font-mono text-[10px] text-atlas-faint mt-0.5">{a.teamName}</p>
                  )}
                </div>
                <Link
                  href={`/coach/athlete/${a.userId}`}
                  className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink border border-atlas-rule px-3 py-1.5 hover:border-atlas-muted transition-colors"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
