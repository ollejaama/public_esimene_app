'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SyncProgressBar } from '@/components/ui/SyncProgressBar'
import { useSyncProgress } from '@/hooks/useSyncProgress'

interface StravaSyncSectionProps {
  lastSyncedAt: string | null
}

export function StravaSyncSection({ lastSyncedAt }: StravaSyncSectionProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncMode, setSyncMode] = useState<'incremental' | 'full'>('incremental')
  const progress = useSyncProgress(syncing)

  async function startSync(mode: 'incremental' | 'full') {
    setSyncMode(mode)
    setSyncing(true)
    try {
      await fetch(`/api/sync?mode=${mode}`, { method: 'POST' })
    } catch (e) {
      setSyncing(false)
    }
  }

  // Stop showing progress bar when done
  const showProgress = syncing && progress.status !== 'idle'
  if (syncing && (progress.status === 'complete' || progress.status === 'error')) {
    setTimeout(() => setSyncing(false), 3000)
  }

  const formattedLastSync = lastSyncedAt
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(lastSyncedAt))
    : 'Never'

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Last synced: <span className="text-gray-900">{formattedLastSync}</span>
      </p>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => startSync('incremental')}
          disabled={syncing}
        >
          Sync latest activities
        </Button>
        <Button
          variant="ghost"
          onClick={() => startSync('full')}
          disabled={syncing}
        >
          Full re-sync
        </Button>
      </div>

      {showProgress && (
        <div className="mt-3 max-w-md">
          <SyncProgressBar
            progress={
              progress.totalEstimate > 0
                ? Math.round((progress.activitiesSynced / progress.totalEstimate) * 100)
                : progress.status === 'complete' ? 100 : 0
            }
            status={progress.message}
            rateLimitCountdown={progress.rateLimitCountdown}
          />
          <p className="text-xs text-gray-400 mt-1">
            {progress.activitiesSynced} activities · {progress.hrStreamsFetched} HR · {progress.gpsStreamsFetched} GPS
          </p>
        </div>
      )}
    </div>
  )
}
