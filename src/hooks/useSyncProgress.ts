'use client'

import { useEffect, useState } from 'react'
import { SyncProgress, SyncStatus } from '@/lib/sync/store'

const DEFAULT: SyncProgress = {
  status: 'idle',
  activitiesSynced: 0,
  hrStreamsFetched: 0,
  gpsStreamsFetched: 0,
  activitiesSkipped: 0,
  totalEstimate: 0,
  message: '',
  rateLimitCountdown: 0,
}

export function useSyncProgress(active: boolean) {
  const [progress, setProgress] = useState<SyncProgress>(DEFAULT)

  useEffect(() => {
    if (!active) return

    const source = new EventSource('/api/sync-progress')

    source.onmessage = (e) => {
      try {
        const data: SyncProgress = JSON.parse(e.data)
        setProgress(data)
        if (data.status === 'complete' || data.status === 'error') {
          source.close()
        }
      } catch {}
    }

    source.onerror = () => {
      source.close()
    }

    return () => source.close()
  }, [active])

  return progress
}
