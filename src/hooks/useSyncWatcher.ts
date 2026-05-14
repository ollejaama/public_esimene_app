'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function useSyncWatcher() {
  const router = useRouter()
  const seenAt = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/sync')
        const { lastSyncedAt } = await res.json()
        if (seenAt.current === undefined) {
          seenAt.current = lastSyncedAt
        } else if (lastSyncedAt !== seenAt.current) {
          seenAt.current = lastSyncedAt
          router.refresh()
        }
      } catch {}
    }

    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [router])
}
