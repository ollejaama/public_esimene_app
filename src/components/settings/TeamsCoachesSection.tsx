'use client'

import { useState } from 'react'

interface PendingInvite {
  id: string
  coachName: string
  teamName: string | null
}

interface CoachLink {
  coachId: string
  coachName: string
  linkedAt: string
}

interface TeamMembership {
  teamId: string
  teamName: string
  coachName: string
  joinedAt: string
}

export function TeamsCoachesSection({
  pendingInvites: initialInvites,
  coachLink: initialCoachLink,
  teamMembership: initialTeam,
}: {
  pendingInvites: PendingInvite[]
  coachLink: CoachLink | null
  teamMembership: TeamMembership | null
}) {
  const [invites, setInvites] = useState(initialInvites)
  const [coachLink, setCoachLink] = useState(initialCoachLink)
  const [teamMembership, setTeamMembership] = useState(initialTeam)
  const [responding, setResponding] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [leaving, setLeaving] = useState(false)

  async function respond(inviteId: string, action: 'accept' | 'decline') {
    setResponding(inviteId)
    const res = await fetch(`/api/invites/${inviteId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setResponding(null)
    if (res.ok) {
      setInvites((inv) => inv.filter((i) => i.id !== inviteId))
      if (action === 'accept') {
        // Refresh to show new coach/team
        window.location.reload()
      }
    }
  }

  async function removeCoach() {
    if (!coachLink) return
    setRemoving(true)
    await fetch('/api/coach-link/remove', { method: 'DELETE' })
    setRemoving(false)
    setCoachLink(null)
  }

  async function leaveTeam() {
    if (!teamMembership) return
    setLeaving(true)
    await fetch(`/api/teams/${teamMembership.teamId}/leave`, { method: 'POST' })
    setLeaving(false)
    setTeamMembership(null)
  }

  const hasAnything = invites.length > 0 || coachLink || teamMembership

  if (!hasAnything) {
    return (
      <p className="font-serif italic text-[14px] text-atlas-faint">
        No coach or team linked.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-3">
            Pending invites
          </p>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between border border-atlas-rule px-4 py-3">
                <div>
                  <p className="font-sans text-[13px] text-atlas-ink">
                    {inv.teamName
                      ? `${inv.coachName} — team "${inv.teamName}"`
                      : `${inv.coachName} wants to follow your training`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(inv.id, 'accept')}
                    disabled={responding === inv.id}
                    className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 disabled:opacity-50"
                    style={{ background: 'var(--atlas-ink)', color: 'var(--atlas-bg)' }}
                  >
                    {responding === inv.id ? '…' : 'Accept'}
                  </button>
                  <button
                    onClick={() => respond(inv.id, 'decline')}
                    disabled={responding === inv.id}
                    className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-atlas-rule text-atlas-muted hover:text-atlas-ink transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current coach */}
      {coachLink && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-3">
            Current coach
          </p>
          <div className="flex items-center justify-between border border-atlas-rule px-4 py-3">
            <div>
              <p className="font-serif text-[16px] text-atlas-ink">{coachLink.coachName}</p>
              <p className="font-mono text-[10px] text-atlas-faint mt-0.5">
                Linked {new Date(coachLink.linkedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={removeCoach}
              disabled={removing}
              className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-atlas-rule text-atlas-muted hover:text-[#a23b2a] hover:border-[#a23b2a] transition-colors disabled:opacity-50"
            >
              {removing ? '…' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Current team */}
      {teamMembership && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-3">
            Current team
          </p>
          <div className="flex items-center justify-between border border-atlas-rule px-4 py-3">
            <div>
              <p className="font-serif text-[16px] text-atlas-ink">{teamMembership.teamName}</p>
              <p className="font-mono text-[10px] text-atlas-faint mt-0.5">
                Coach: {teamMembership.coachName} · Joined {new Date(teamMembership.joinedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={leaveTeam}
              disabled={leaving}
              className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-atlas-rule text-atlas-muted hover:text-[#a23b2a] hover:border-[#a23b2a] transition-colors disabled:opacity-50"
            >
              {leaving ? '…' : 'Leave'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
