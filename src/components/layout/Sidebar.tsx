'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const NAV_SECTIONS = [
  {
    label: 'Analyse',
    items: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/statistics', label: 'Statistics' },
      { href: '/activities', label: 'Calendar' },
    ],
  },
  {
    label: 'Plan',
    items: [
      { href: '/plan', label: 'Plan' },
    ],
  },
  {
    label: 'Compare',
    items: [
      { href: '/compare', label: 'Compare' },
    ],
  },
]

export function Sidebar({ athleteName, role = 'athlete' }: { athleteName?: string; role?: 'athlete' | 'coach' }) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-52 bg-white border-r border-[#e5e5e5] flex flex-col z-40">
      {/* Logo / App name */}
      <div className="px-5 py-5 border-b border-[#f0f0f0]">
        <Link href="/home" className="text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors">
          Training Analytics
        </Link>
      </div>

      {/* Athlete name */}
      {athleteName && (
        <div className="px-5 py-3 border-b border-[#f0f0f0]">
          <span className="text-xs text-gray-500">{athleteName}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'block px-3 py-2 rounded-md text-sm transition-colors',
                      active
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings + Logout */}
      <div className="px-3 py-4 border-t border-[#f0f0f0] space-y-0.5">
        {role === 'athlete' && (
          <Link
            href="/settings"
            className={clsx(
              'block px-3 py-2 rounded-md text-sm transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            Settings
          </Link>
        )}
        <Link
          href="/"
          className="block px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          ← Landing
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  )
}
