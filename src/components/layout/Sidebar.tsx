'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ATHLETE_NAV_SECTIONS = [
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

export function Sidebar({ role = 'athlete' }: { athleteName?: string; role?: 'athlete' | 'coach' }) {
  const pathname = usePathname()

  const athleteViewMatch = pathname.match(/^\/coach\/athlete\/([^/]+)/)
  const viewingAthleteId = athleteViewMatch?.[1] ?? null

  const coachAthleteNav = viewingAthleteId
    ? [
        {
          label: 'Analyse',
          items: [
            { href: `/coach/athlete/${viewingAthleteId}`, label: 'Calendar' },
            { href: `/coach/athlete/${viewingAthleteId}/statistics`, label: 'Statistics' },
          ],
        },
      ]
    : []

  const navSections = role === 'coach' ? coachAthleteNav : ATHLETE_NAV_SECTIONS

  return (
    <aside className="fixed left-0 top-[53px] h-[calc(100vh-53px)] w-48 border-r border-atlas-rule bg-atlas-bg flex flex-col z-40">
      <nav className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto">
        {role === 'coach' && viewingAthleteId && (
          <div className="px-6 pb-2">
            <Link
              href="/coach"
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-atlas-faint hover:text-atlas-muted transition-colors"
            >
              ← My athletes
            </Link>
          </div>
        )}
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-6 pb-2 font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint">
              — {section.label}
            </p>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
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
        {role === 'athlete' && (
          <Link
            href="/settings"
            className={`block font-sans text-xs transition-colors ${
              pathname.startsWith('/settings')
                ? 'text-atlas-ink'
                : 'text-atlas-muted hover:text-atlas-ink'
            }`}
          >
            Settings
          </Link>
        )}
        {role === 'coach' && !viewingAthleteId && (
          <Link
            href="/coach"
            className={`block font-sans text-xs transition-colors ${
              pathname === '/coach'
                ? 'text-atlas-ink'
                : 'text-atlas-muted hover:text-atlas-ink'
            }`}
          >
            My athletes
          </Link>
        )}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="font-sans text-xs text-atlas-faint hover:text-atlas-muted transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  )
}
