'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function usePlanWatcher() {
  const router = useRouter()
  const seenKey = useRef<string | undefined>(undefined)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/planned-activities?check=1')
        const { latestAt, count } = await res.json()
        const key = `${count}:${latestAt}`
        if (seenKey.current === undefined) {
          seenKey.current = key
        } else if (key !== seenKey.current) {
          seenKey.current = key
          router.refresh()
        }
      } catch {}
    }

    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [router])
}
