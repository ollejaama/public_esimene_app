'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ATHLETE_NAV = [
  {
    label: 'Analyse',
    items: [
      { href: '/activities', label: 'Calendar' },
      { href: '/statistics', label: 'Statistics' },
    ],
  },
  {
    label: 'Plan',
    items: [{ href: '/plan', label: 'Plan' }],
  },
  {
    label: 'Compare',
    items: [{ href: '/compare', label: 'Compare' }],
  },
]

interface SidebarProps {
  role?: 'athlete' | 'coach'
  viewingAthleteId?: string
  viewingAthleteName?: string
}

export function Sidebar({ role = 'athlete', viewingAthleteId, viewingAthleteName }: SidebarProps) {
  const pathname = usePathname()

  if (role === 'coach' && viewingAthleteId) {
    // Coach viewing a specific athlete — show athlete-scoped nav
    const base = `/coach/athlete/${viewingAthleteId}`
    const calendarActive = pathname === base || pathname === `${base}/`
    const statsActive = pathname.startsWith(`${base}/statistics`)
    const planActive = pathname.startsWith(`${base}/plan`)
    return (
      <aside className="fixed left-0 top-[53px] h-[calc(100vh-53px)] w-48 border-r border-atlas-rule bg-atlas-bg flex flex-col z-40">
        <div className="px-6 pt-5 pb-2 border-b border-atlas-rule">
          <Link
            href="/coach"
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-faint hover:text-atlas-muted transition-colors flex items-center gap-1"
          >
            ← Athletes
          </Link>
          {viewingAthleteName && (
            <p className="font-serif text-[13px] text-atlas-ink mt-2 leading-tight">
              {viewingAthleteName}
            </p>
          )}
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1">
          <Link
            href={base}
            className={`block px-6 py-[7px] font-serif text-sm -ml-[2px] border-l-2 transition-colors ${
              calendarActive
                ? 'italic text-atlas-ink border-atlas-accent'
                : 'text-atlas-muted border-transparent hover:text-atlas-ink'
            }`}
          >
            Calendar
          </Link>
          <Link
            href={`${base}/statistics`}
            className={`block px-6 py-[7px] font-serif text-sm -ml-[2px] border-l-2 transition-colors ${
              statsActive
                ? 'italic text-atlas-ink border-atlas-accent'
                : 'text-atlas-muted border-transparent hover:text-atlas-ink'
            }`}
          >
            Statistics
          </Link>
          <Link
            href={`${base}/plan`}
            className={`block px-6 py-[7px] font-serif text-sm -ml-[2px] border-l-2 transition-colors ${
              planActive
                ? 'italic text-atlas-ink border-atlas-accent'
                : 'text-atlas-muted border-transparent hover:text-atlas-ink'
            }`}
          >
            Plan
          </Link>
        </nav>
        <div className="px-6 py-4 border-t border-atlas-rule">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="font-sans text-xs text-atlas-faint hover:text-atlas-muted transition-colors">
              Log out
            </button>
          </form>
        </div>
      </aside>
    )
  }

  if (role === 'coach') {
    // Coach at their own dashboard
    return (
      <aside className="fixed left-0 top-[53px] h-[calc(100vh-53px)] w-48 border-r border-atlas-rule bg-atlas-bg flex flex-col z-40">
        <nav className="flex-1 py-6">
          <div>
            <p className="px-6 pb-2 font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint">
              — Coach
            </p>
            <Link
              href="/coach"
              className={`block px-6 py-[7px] font-serif text-sm -ml-[2px] border-l-2 transition-colors ${
                pathname === '/coach'
                  ? 'italic text-atlas-ink border-atlas-accent'
                  : 'text-atlas-muted border-transparent hover:text-atlas-ink'
              }`}
            >
              My athletes
            </Link>
          </div>
        </nav>
        <div className="px-6 py-4 border-t border-atlas-rule">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="font-sans text-xs text-atlas-faint hover:text-atlas-muted transition-colors">
              Log out
            </button>
          </form>
        </div>
      </aside>
    )
  }

  // Regular athlete nav
  return (
    <aside className="fixed left-0 top-[53px] h-[calc(100vh-53px)] w-48 border-r border-atlas-rule bg-atlas-bg flex flex-col z-40">
      <nav className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto">
        {ATHLETE_NAV.map((section) => (
          <div key={section.label}>
            <p className="px-6 pb-2 font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint">
              — {section.label}
            </p>
            {section.items.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-6 py-[7px] font-serif text-sm -ml-[2px] border-l-2 transition-colors ${
                    active
                      ? 'italic text-atlas-ink border-atlas-accent atlas-nav-active'
                      : 'text-atlas-muted border-transparent hover:text-atlas-ink'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-atlas-rule space-y-2">
        <Link
          href="/settings"
          className={`block font-sans text-xs transition-colors ${
            pathname.startsWith('/settings') ? 'text-atlas-ink' : 'text-atlas-muted hover:text-atlas-ink'
          }`}
        >
          Settings
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="font-sans text-xs text-atlas-faint hover:text-atlas-muted transition-colors">
            Log out
          </button>
        </form>
      </div>
    </aside>
  )
}
