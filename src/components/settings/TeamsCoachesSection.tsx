'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PendingInvite {
  id: string
  token: string
  coach_name: string | null
  team_name: string | null
  expires_at: string
}

interface CoachInfo {
  id: string
  display_name: string | null
  linked_at: string
}

interface TeamInfo {
  id: string
  name: string
  coach_name: string | null
  joined_at: string
}

interface Props {
  pendingInvites: PendingInvite[]
  coach: CoachInfo | null
  team: TeamInfo | null
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export function TeamsCoachesSection({ pendingInvites: initialInvites, coach, team }: Props) {
  const router = useRouter()
  const [invites, setInvites] = useState(initialInvites)
  const [actingOn, setActingOn] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [removing, setRemoving] = useState<'coach' | 'team' | null>(null)

  async function accept(token: string, inviteId: string) {
    setActingOn(inviteId)
    setErrors((prev) => { const n = { ...prev }; delete n[inviteId]; return n })
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        setErrors((prev) => ({ ...prev, [inviteId]: d.error ?? 'Failed to accept' }))
      } else {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId))
        router.refresh()
      }
    } catch {
      setErrors((prev) => ({ ...prev, [inviteId]: 'Network error' }))
    }
    setActingOn(null)
  }

  async function decline(token: string, inviteId: string) {
    setActingOn(inviteId)
    setErrors((prev) => { const n = { ...prev }; delete n[inviteId]; return n })
    try {
      await fetch(`/api/invites/${token}/decline`, { method: 'POST' })
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    } catch {}
    setActingOn(null)
  }

  async function removeCoach() {
    if (!confirm('Remove your coach? You will no longer be linked.')) return
    setRemoving('coach')
    try {
      await fetch('/api/athlete/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkType: 'coach' }),
      })
      router.refresh()
    } catch {}
    setRemoving(null)
  }

  async function leaveTeam() {
    if (!confirm('Leave this team?')) return
    setRemoving('team')
    try {
      await fetch('/api/athlete/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkType: 'team' }),
      })
      router.refresh()
    } catch {}
    setRemoving(null)
  }

  const hasAnything = invites.length > 0 || coach || team

  if (!hasAnything) {
    return (
      <p className="font-sans text-[13px] text-atlas-faint italic">
        No coach or team linked. A coach can invite you from their dashboard.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-2">
            Pending invites
          </p>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="border border-atlas-rule px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-sans text-[13px] text-atlas-ink">
                      {inv.coach_name ?? 'A coach'} has invited you
                      {inv.team_name && <> to join <span className="font-semibold">{inv.team_name}</span></>}
                    </p>
                    <p className="font-mono text-[10px] text-atlas-faint mt-0.5">
                      Expires {formatDate(inv.expires_at)}
                    </p>
                    {errors[inv.id] && (
                      <p className="font-mono text-[10px] text-[#a23b2a] mt-1">{errors[inv.id]}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => accept(inv.token, inv.id)}
                      disabled={actingOn === inv.id}
                      className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink transition-colors disabled:opacity-40"
                    >
                      {actingOn === inv.id ? '…' : 'Accept'}
                    </button>
                    <button
                      onClick={() => decline(inv.token, inv.id)}
                      disabled={actingOn === inv.id}
                      className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-[#a23b2a] transition-colors disabled:opacity-40"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current coach */}
      {coach && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-2">
            Your coach
          </p>
          <div className="border border-atlas-rule px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-sans text-[13px] text-atlas-ink">{coach.display_name ?? 'Unknown'}</p>
              <p className="font-mono text-[10px] text-atlas-faint mt-0.5">
                Linked {formatDate(coach.linked_at)}
              </p>
            </div>
            <button
              onClick={removeCoach}
              disabled={removing === 'coach'}
              className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-[#a23b2a] transition-colors disabled:opacity-40"
            >
              {removing === 'coach' ? '…' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Current team */}
      {team && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-2">
            Your team
          </p>
          <div className="border border-atlas-rule px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-sans text-[13px] text-atlas-ink">{team.name}</p>
              <p className="font-mono text-[10px] text-atlas-faint mt-0.5">
                {team.coach_name && `Coach: ${team.coach_name} · `}Joined {formatDate(team.joined_at)}
              </p>
            </div>
            <button
              onClick={leaveTeam}
              disabled={removing === 'team'}
              className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-faint hover:text-[#a23b2a] transition-colors disabled:opacity-40"
            >
              {removing === 'team' ? '…' : 'Leave'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
