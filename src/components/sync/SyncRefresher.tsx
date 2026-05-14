'use client'

import { useSyncWatcher } from '@/hooks/useSyncWatcher'

export function SyncRefresher() {
  useSyncWatcher()
  return null
}
