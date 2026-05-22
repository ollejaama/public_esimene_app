'use client'

import { useEffect, useRef, useState } from 'react'

interface AppNotification {
  id: string
  type: string
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationItem({
  notification,
  onAction,
}: {
  notification: AppNotification
  onAction: () => void
}) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const p = notification.payload
  const isInvite = notification.type === 'coach_invite' || notification.type === 'team_invite'
  const token = p.inviteToken as string | undefined
  const coachName = p.coachName as string
  const teamName = p.teamName as string | null

  let title = ''
  let description = ''

  if (notification.type === 'coach_invite') {
    title = 'Coaching request'
    description = `${coachName} wants to follow your training`
  } else if (notification.type === 'team_invite') {
    title = 'Team invite'
    description = `${coachName} invited you to join ${teamName ?? 'their team'}`
  } else if (notification.type === 'invite_accepted') {
    title = 'Invite accepted'
    description = `${p.athleteName} accepted your invite${p.teamName ? ` and joined ${p.teamName}` : ''}`
  } else if (notification.type === 'invite_declined') {
    title = 'Invite declined'
    description = `${p.athleteName} declined your invite`
  } else {
    title = notification.type
    description = JSON.stringify(p)
  }

  async function handleInviteAction(action: 'accept' | 'decline') {
    if (!token) return
    setLoading(action)
    setError(null)
    try {
      const res = await fetch(`/api/invites/${token}/${action}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
      } else {
        setDone(true)
        onAction()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={`px-4 py-3 border-b border-atlas-rule last:border-0 ${notification.read_at ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted">{title}</p>
          <p className="font-sans text-[12px] text-atlas-ink mt-0.5 leading-snug">{description}</p>
          {error && <p className="font-mono text-[10px] text-[#a23b2a] mt-1">{error}</p>}
        </div>
        <span className="font-mono text-[10px] text-atlas-faint whitespace-nowrap flex-shrink-0">
          {relativeTime(notification.created_at)}
        </span>
      </div>

      {isInvite && !done && !notification.read_at && token && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleInviteAction('accept')}
            disabled={!!loading}
            className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1 border border-atlas-ink text-atlas-ink hover:bg-atlas-ink hover:text-atlas-bg transition-colors disabled:opacity-50"
          >
            {loading === 'accept' ? '…' : 'Accept'}
          </button>
          <button
            onClick={() => handleInviteAction('decline')}
            disabled={!!loading}
            className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1 border border-atlas-rule text-atlas-muted hover:border-atlas-ink transition-colors disabled:opacity-50"
          >
            {loading === 'decline' ? '…' : 'Decline'}
          </button>
        </div>
      )}
      {done && (
        <p className="font-mono text-[10px] text-atlas-faint mt-2">Done</p>
      )}
    </div>
  )
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function fetchCount() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.unreadCount ?? 0)
      if (open) setNotifications(data.notifications ?? [])
    } catch {}
  }

  async function openDropdown() {
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {}
    setLoading(false)
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  // Poll for new notifications every 30s
  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={open ? () => setOpen(false) : openDropdown}
        className="relative flex items-center justify-center w-8 h-8 border border-atlas-rule hover:border-atlas-muted transition-colors"
        aria-label="Notifications"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-atlas-ink">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center font-mono text-[9px] leading-none text-atlas-bg bg-atlas-accent border border-atlas-bg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-atlas-bg border border-atlas-rule shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-atlas-rule">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="font-mono text-[10px] text-atlas-faint hover:text-atlas-muted transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center">
                <span className="font-mono text-[11px] text-atlas-faint">Loading…</span>
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center">
                <span className="font-mono text-[11px] text-atlas-faint">No notifications</span>
              </div>
            )}
            {!loading &&
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onAction={() => {
                    fetchCount()
                    setNotifications((prev) =>
                      prev.map((x) =>
                        x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
                      )
                    )
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
