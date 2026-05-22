'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { InviteModal } from './InviteModal'
import type { CoachAthlete, CoachTeam, PendingInvite } from '@/lib/coach'

interface Props {
  athletes: CoachAthlete[]
  teams: CoachTeam[]
  pendingInvites: PendingInvite[]
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function formatSynced(iso: string | null): string {
  if (!iso) return 'Never synced'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export function CoachDashboard({ athletes, teams, pendingInvites: initialInvites }: Props) {
  const router = useRouter()
  const [showInvite, setShowInvite] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [teamError, setTeamError] = useState<string | null>(null)
  const [invites, setInvites] = useState(initialInvites)
  const [removingInvite, setRemovingInvite] = useState<string | null>(null)

  async function createTeam() {
    if (!teamName.trim()) return
    setCreatingTeam(true)
    setTeamError(null)
    try {
      const res = await fetch('/api/coach/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setTeamError(d.error ?? 'Failed')
      } else {
        setTeamName('')
        setShowCreateTeam(false)
        router.refresh()
      }
    } catch {
      setTeamError('Network error')
    } finally {
      setCreatingTeam(false)
    }
  }

  async function revokeInvite(inviteId: string) {
    setRemovingInvite(inviteId)
    try {
      await fetch(`/api/coach/invites/${inviteId}`, { method: 'DELETE' })
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    } catch {}
    setRemovingInvite(null)
  }

  async function removeAthlete(athleteId: string) {
    await fetch('/api/coach/athletes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId }),
    })
    router.refresh()
  }

  async function removeFromTeam(teamId: string, athleteId: string) {
    await fetch(`/api/coach/teams/${teamId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId }),
    })
    router.refresh()
  }

  async function deleteTeam(teamId: string) {
    if (!confirm('Delete this team? Athletes will lose their team membership.')) return
    await fetch(`/api/coach/teams/${teamId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-atlas-rule pb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-2">
            Coach dashboard
          </p>
          <h1 className="font-serif text-[40px] leading-[0.95] tracking-[-0.025em] text-atlas-ink">
            My athletes
          </h1>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-2.5 hover:opacity-85 transition-opacity"
          style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
        >
          Invite athlete
        </button>
      </div>

      {/* Teams section */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            — My teams ({teams.length})
          </h2>
          <button
            onClick={() => setShowCreateTeam((v) => !v)}
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-atlas-muted transition-colors"
          >
            + New team
          </button>
        </div>

        {showCreateTeam && (
          <div className="flex gap-2 mb-4 items-start">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTeam()}
              placeholder="Team name…"
              autoFocus
              className="flex-1 border border-atlas-rule bg-transparent font-sans text-[13px] text-atlas-ink px-3 py-2 outline-none focus:border-atlas-ink transition-colors"
            />
            <button
              onClick={createTeam}
              disabled={creatingTeam || !teamName.trim()}
              className="font-sans text-[13px] px-4 py-2 border border-atlas-ink text-atlas-ink hover:bg-atlas-ink hover:text-atlas-bg transition-colors disabled:opacity-40"
            >
              {creatingTeam ? '…' : 'Create'}
            </button>
            <button onClick={() => setShowCreateTeam(false)} className="font-sans text-[13px] px-3 py-2 text-atlas-muted hover:text-atlas-ink transition-colors">
              Cancel
            </button>
            {teamError && <p className="font-mono text-[10px] text-[#a23b2a] self-center">{teamError}</p>}
          </div>
        )}

        {teams.length === 0 && (
          <p className="font-sans text-[13px] text-atlas-faint italic">No teams yet. Create one to group your athletes.</p>
        )}

        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="border border-atlas-rule p-5">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-serif text-[18px] text-atlas-ink">{team.name}</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInvite(true)}
                    className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink transition-colors"
                  >
                    + Invite
                  </button>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-[#a23b2a] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {team.members.length === 0 ? (
                <p className="font-sans text-[12px] text-atlas-faint italic">No members yet</p>
              ) : (
                <div className="space-y-1.5">
                  {team.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <Link
                        href={`/coach/athlete/${m.id}`}
                        className="font-sans text-[13px] text-atlas-ink hover:text-atlas-accent transition-colors"
                      >
                        {m.display_name}
                      </Link>
                      <button
                        onClick={() => removeFromTeam(team.id, m.id)}
                        className="font-mono text-[10px] text-atlas-faint hover:text-[#a23b2a] transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* All athletes section */}
      <section>
        <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-4">
          — All athletes ({athletes.length})
        </h2>

        {athletes.length === 0 ? (
          <div className="border border-atlas-rule p-8 max-w-lg">
            <p className="font-sans text-[14px] text-atlas-muted leading-[1.55]">
              No athletes linked yet. Use the{' '}
              <button onClick={() => setShowInvite(true)} className="underline hover:text-atlas-ink transition-colors">
                Invite athlete
              </button>{' '}
              button to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {athletes.map((a) => (
              <div key={a.id} className="flex items-center justify-between border border-atlas-rule px-5 py-3.5 hover:bg-atlas-panel transition-colors group">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/coach/athlete/${a.id}`}
                    className="font-serif text-[16px] text-atlas-ink hover:text-atlas-accent transition-colors"
                  >
                    {a.display_name ?? 'Unknown athlete'}
                  </Link>
                  <div className="flex items-center gap-3 mt-0.5">
                    {a.team_name && (
                      <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-atlas-faint border border-atlas-rule px-1.5 py-0.5">
                        {a.team_name}
                      </span>
                    )}
                    {!a.team_name && (
                      <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-atlas-faint">Individual</span>
                    )}
                    <span className="font-mono text-[10px] text-atlas-faint">
                      {formatSynced(a.last_synced_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/coach/athlete/${a.id}`}
                    className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink transition-colors"
                  >
                    View
                  </Link>
                  {a.link_type === 'direct' && (
                    <button
                      onClick={() => removeAthlete(a.id)}
                      className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-[#a23b2a] transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending invites */}
      {invites.length > 0 && (
        <section>
          <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-4">
            — Pending invites ({invites.length})
          </h2>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between border border-atlas-rule px-5 py-3">
                <div>
                  <p className="font-sans text-[13px] text-atlas-ink">
                    {inv.invited_name ?? inv.invited_email}
                  </p>
                  <p className="font-mono text-[10px] text-atlas-faint">
                    {inv.team_name ? `Team: ${inv.team_name} · ` : 'Individual · '}
                    Sent {formatDate(inv.created_at)} · Expires {formatDate(inv.expires_at)}
                  </p>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  disabled={removingInvite === inv.id}
                  className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-[#a23b2a] transition-colors disabled:opacity-40"
                >
                  {removingInvite === inv.id ? '…' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {showInvite && (
        <InviteModal
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          onClose={() => setShowInvite(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
