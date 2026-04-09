export type SyncStatus = 'idle' | 'running' | 'rate_limited' | 'complete' | 'error'

export interface SyncProgress {
  status: SyncStatus
  activitiesSynced: number
  hrStreamsFetched: number
  gpsStreamsFetched: number
  activitiesSkipped: number
  totalEstimate: number
  message: string
  rateLimitCountdown: number  // seconds to wait
  error?: string
}

// In-memory store — sufficient for a single-user personal app.
const store = new Map<string, SyncProgress>()

export function getSyncProgress(userId: string): SyncProgress {
  return store.get(userId) ?? {
    status: 'idle',
    activitiesSynced: 0,
    hrStreamsFetched: 0,
    gpsStreamsFetched: 0,
    activitiesSkipped: 0,
    totalEstimate: 0,
    message: '',
    rateLimitCountdown: 0,
  }
}

export function setSyncProgress(userId: string, update: Partial<SyncProgress>): void {
  const current = getSyncProgress(userId)
  store.set(userId, { ...current, ...update })
}

export function clearSyncProgress(userId: string): void {
  store.delete(userId)
}
