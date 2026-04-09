interface SyncProgressBarProps {
  progress: number        // 0–100
  status: string
  rateLimitCountdown?: number  // seconds remaining in rate limit pause
}

export function SyncProgressBar({ progress, status, rateLimitCountdown }: SyncProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{status}</span>
        {rateLimitCountdown != null && rateLimitCountdown > 0 && (
          <span className="text-orange-600 font-medium">
            Rate limit — retrying in {rateLimitCountdown}s
          </span>
        )}
      </div>
    </div>
  )
}
