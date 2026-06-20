'use client'

import { useEffect, useRef, useState } from 'react'

interface Notification {
  id: string
  type: string
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [responding, setResponding] = useState<string | null>(null)
  const [responded, setResponded] = useState<Record<string, 'accept' | 'decline'>>({})
  const ref = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    const res = await fetch('/api/notifications')
    if (!res.ok) return
    const data = await res.json()
    setNotifications(data.notifications ?? [])
    setUnreadCount(data.unreadCount ?? 0)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleOpen() {
    setOpen((v) => !v)
    if (!open && unreadCount > 0) {
      await fetch('/api/notifications/read', { method: 'PATCH' })
      setUnreadCount(0)
    }
  }

  async function respond(inviteId: string, action: 'accept' | 'decline') {
    setResponding(inviteId)
    const res = await fetch(`/api/invites/${inviteId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setResponding(null)
    if (res.ok) {
      setResponded((prev) => ({ ...prev, [inviteId]: action }))
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.type !== 'coach_invite' || (n.payload.inviteId as string) !== inviteId)
        )
      }, 1500)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative border border-atlas-rule bg-transparent font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 hover:border-atlas-muted transition-colors text-atlas-ink"
        aria-label="Notifications"
      >
        ▲ Bell
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono"
            style={{ background: 'var(--atlas-accent)', color: 'var(--atlas-bg)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-atlas-panel border border-atlas-rule z-50"
          style={{ maxHeight: 400, overflowY: 'auto' }}
        >
          {notifications.length === 0 ? (
            <p className="font-mono text-[11px] text-atlas-faint p-4 text-center">
              No notifications
            </p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="border-b border-atlas-rule last:border-0 p-4">
                {n.type === 'coach_invite' && (
                  <CoachInviteNotification
                    payload={n.payload}
                    onRespond={respond}
                    responding={responding}
                    respondedAction={responded[n.payload.inviteId as string] ?? null}
                  />
                )}
                {n.type === 'invite_accepted' && (
                  <InviteAcceptedNotification payload={n.payload} />
                )}
                {n.type === 'coach_comment' && (
                  <CoachCommentNotification payload={n.payload} />
                )}
                {n.type === 'athlete_heart' && (
                  <AthleteHeartNotification payload={n.payload} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function CoachInviteNotification({
  payload,
  onRespond,
  responding,
  respondedAction,
}: {
  payload: Record<string, unknown>
  onRespond: (inviteId: string, action: 'accept' | 'decline') => void
  responding: string | null
  respondedAction: 'accept' | 'decline' | null
}) {
  const inviteId = payload.inviteId as string
  const coachName = payload.coachName as string
  const teamName = payload.teamName as string | null
  const isResponding = responding === inviteId

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-1">
        Coach invite
      </p>
      <p className="font-sans text-[13px] text-atlas-ink mb-3">
        {teamName
          ? `${coachName} invited you to join team "${teamName}"`
          : `${coachName} wants to follow your training`}
      </p>
      {respondedAction ? (
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-atlas-faint">
          {respondedAction === 'accept' ? 'Accepted' : 'Declined'}
        </p>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => onRespond(inviteId, 'accept')}
            disabled={isResponding}
            className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--atlas-ink)', color: 'var(--atlas-bg)' }}
          >
            {isResponding ? '…' : 'Accept'}
          </button>
          <button
            onClick={() => onRespond(inviteId, 'decline')}
            disabled={isResponding}
            className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-atlas-rule text-atlas-muted hover:text-atlas-ink transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  )
}

function InviteAcceptedNotification({ payload }: { payload: Record<string, unknown> }) {
  const athleteName = payload.athleteName as string
  const teamName = payload.teamName as string | null
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-1">
        Invite accepted
      </p>
      <p className="font-sans text-[13px] text-atlas-ink">
        {teamName
          ? `${athleteName} joined your team "${teamName}"`
          : `${athleteName} accepted your coaching invite`}
      </p>
    </div>
  )
}

function CoachCommentNotification({ payload }: { payload: Record<string, unknown> }) {
  const coachName = payload.coachName as string
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-1">
        Coach comment
      </p>
      <p className="font-sans text-[13px] text-atlas-ink">
        {coachName} left a comment on your activity
      </p>
    </div>
  )
}

function AthleteHeartNotification({ payload }: { payload: Record<string, unknown> }) {
  const athleteName = payload.athleteName as string
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted mb-1">
        Reaction
      </p>
      <p className="font-sans text-[13px] text-atlas-ink">
        {athleteName} reacted to your comment
      </p>
    </div>
  )
}
