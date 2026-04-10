'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { SyncProgressBar } from '@/components/ui/SyncProgressBar'
import { useSyncProgress } from '@/hooks/useSyncProgress'

interface StravaSyncSectionProps {
  lastSyncedAt: string | null
}

function formatSyncDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function StravaSyncSection({ lastSyncedAt }: StravaSyncSectionProps) {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncDisplay, setLastSyncDisplay] = useState(formatSyncDate(lastSyncedAt))
  const [forceOverwrite, setForceOverwrite] = useState(false)
  const progress = useSyncProgress(syncing)
  const didRefreshRef = useRef(false)

  // After sync completes, fetch updated last_synced_at from server
  useEffect(() => {
    if (progress.status === 'complete' && !didRefreshRef.current) {
      didRefreshRef.current = true
      fetch('/api/sync')
        .then((r) => r.json())
        .then((data) => {
          if (data.lastSyncedAt) setLastSyncDisplay(formatSyncDate(data.lastSyncedAt))
        })
        .catch(() => {})
    }
    if (progress.status !== 'complete') {
      didRefreshRef.current = false
    }
  }, [progress.status])

  async function startSync(mode: 'incremental' | 'full') {
    setSyncing(true)
    try {
      await fetch(`/api/sync?mode=${mode}`, { method: 'POST' })
    } catch {
      setSyncing(false)
    }
  }

  async function startStreamsSync() {
    setSyncing(true)
    try {
      await fetch(`/api/sync-streams?force=${forceOverwrite}`, { method: 'POST' })
    } catch {
      setSyncing(false)
    }
  }

  const showProgress = syncing && progress.status !== 'idle'
  if (syncing && (progress.status === 'complete' || progress.status === 'error')) {
    setTimeout(() => setSyncing(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Activity sync */}
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Last synced: <span className="text-gray-900">{lastSyncDisplay}</span>
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => startSync('incremental')} disabled={syncing}>
            Sync latest activities
          </Button>
          <Button variant="ghost" onClick={() => startSync('full')} disabled={syncing}>
            Full re-sync
          </Button>
        </div>
      </div>

      {/* Streams re-sync */}
      <div className="space-y-3 pt-4 border-t border-[#f0f0f0]">
        <div>
          <p className="text-sm font-medium text-gray-700">Re-sync streams</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Re-fetches HR streams, GPS tracks, and lap data for all existing activities.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={forceOverwrite}
            onChange={(e) => setForceOverwrite(e.target.checked)}
            className="w-3.5 h-3.5 accent-gray-700"
            disabled={syncing}
          />
          <span className="text-sm text-gray-600">Force overwrite existing data</span>
        </label>
        <Button variant="ghost" onClick={startStreamsSync} disabled={syncing}>
          Re-sync all streams
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
            {progress.activitiesSynced} activities · {progress.hrStreamsFetched} HR · {progress.gpsStreamsFetched} GPS · {progress.lapsFetched} laps
          </p>
        </div>
      )}
    </div>
  )
}
