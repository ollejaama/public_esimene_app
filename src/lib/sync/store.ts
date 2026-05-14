import { createServiceClient } from '@/lib/supabase/server'

export type SyncStatus = 'idle' | 'running' | 'rate_limited' | 'complete' | 'error'

export interface SyncProgress {
  status: SyncStatus
  activitiesSynced: number
  hrStreamsFetched: number
  gpsStreamsFetched: number
  lapsFetched: number
  activitiesSkipped: number
  totalEstimate: number
  message: string
  rateLimitCountdown: number
  error?: string
}

const DEFAULT: SyncProgress = {
  status: 'idle',
  activitiesSynced: 0,
  hrStreamsFetched: 0,
  gpsStreamsFetched: 0,
  lapsFetched: 0,
  activitiesSkipped: 0,
  totalEstimate: 0,
  message: '',
  rateLimitCountdown: 0,
}

// In-memory cache for fast reads within the same serverless instance.
const cache = new Map<string, SyncProgress>()
const lastWrite = new Map<string, number>()
const WRITE_INTERVAL_MS = 2000

export function getSyncProgress(userId: string): SyncProgress {
  return cache.get(userId) ?? DEFAULT
}

export async function getSyncProgressFromDB(userId: string): Promise<SyncProgress> {
  const db = createServiceClient()
  const { data } = await db
    .from('profiles')
    .select('sync_progress')
    .eq('user_id', userId)
    .single()
  return (data?.sync_progress as SyncProgress) ?? DEFAULT
}

export function setSyncProgress(userId: string, update: Partial<SyncProgress>): void {
  const current = getSyncProgress(userId)
  const next = { ...current, ...update }
  cache.set(userId, next)

  const now = Date.now()
  const isStatusChange = update.status !== undefined
  if (isStatusChange || now - (lastWrite.get(userId) ?? 0) > WRITE_INTERVAL_MS) {
    lastWrite.set(userId, now)
    persistProgress(userId, next).catch(console.error)
  }
}

export function clearSyncProgress(userId: string): void {
  cache.delete(userId)
  lastWrite.delete(userId)
  persistProgress(userId, DEFAULT).catch(console.error)
}

async function persistProgress(userId: string, progress: SyncProgress): Promise<void> {
  const db = createServiceClient()
  await db.from('profiles').update({ sync_progress: progress }).eq('user_id', userId)
}
