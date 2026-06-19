'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { NotificationBell } from '@/components/notifications/NotificationBell'

const CHAPTERS: Record<string, [string, string]> = {
  '/activities': ['02', 'Calendar'],
  '/statistics': ['04', 'Statistics'],
  '/plan':       ['03', 'The plan ahead'],
  '/compare':    ['05', 'Compare'],
  '/settings':   ['06', 'Settings'],
  '/home':       ['01', 'Dashboard'],
}

export function AtlasMasthead({ athleteName, role }: { athleteName?: string; role?: string }) {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('atlas-theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.dataset.atlasTheme = saved
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.dataset.atlasTheme = next
    localStorage.setItem('atlas-theme', next)
    fetch('/api/settings/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {})
  }

  const chapter = Object.entries(CHAPTERS).find(([path]) => pathname.startsWith(path))
  const [chapterNum, chapterLabel] = chapter?.[1] ?? ['01', 'Home']

  const userLabel = athleteName
    ? `${athleteName.toUpperCase()} · ${(role ?? 'athlete').toUpperCase()}`
    : 'TREENING · ATLAS'

  return (
    <header className="fixed top-0 left-0 right-0 h-[53px] z-50 flex items-center justify-between px-9 border-b border-atlas-rule bg-atlas-bg">
      <div className="flex items-baseline gap-3.5">
        <span className="font-serif text-[22px] font-medium italic tracking-[-0.02em] text-atlas-ink leading-none">
          Treening<span className="text-atlas-accent">·</span>Atlas
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted">
          № {chapterNum} — {chapterLabel}
        </span>
      </div>

      <div className="flex items-center gap-[18px]">
        <span className="font-mono text-[10px] tracking-[0.08em] text-atlas-muted">
          {userLabel}
        </span>
        <NotificationBell />
        <button
          onClick={toggleTheme}
          className="border border-atlas-rule bg-transparent text-atlas-ink font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 hover:border-atlas-muted transition-colors"
        >
          {theme === 'light' ? '☾ Dark' : '☀ Light'}
        </button>
      </div>
    </header>
  )
}
