import { WeekSummary } from '@/lib/analytics/weekSummary'
import { formatDuration } from '@/lib/analytics/hrZones'
import { SPORT_BREAKDOWN_ROWS } from '@/lib/constants'

const SKIING_KEYS = ['crosscountry_classic', 'cr_skate', 'rollerski_classic', 'rollerski_skate', 'treadmill_skiing', 'Skiing']

interface SportBreakdownTableProps {
  bySport: WeekSummary['bySport']
}

export function SportBreakdownTable({ bySport }: SportBreakdownTableProps) {
  const sportMap = new Map(bySport.map((s) => [s.key, s]))
  const totalSeconds = bySport.reduce((sum, s) => sum + s.seconds, 0)

  const rows = SPORT_BREAKDOWN_ROWS
    .map((row) => {
      const data = sportMap.get(row.key)
      return data ? { ...row, seconds: data.seconds, sessions: data.sessions } : null
    })
    .filter(Boolean) as Array<typeof SPORT_BREAKDOWN_ROWS[number] & { seconds: number; sessions: number }>

  const skiingSeconds = SKIING_KEYS.reduce((sum, k) => sum + (sportMap.get(k)?.seconds ?? 0), 0)
  const skiingSessions = SKIING_KEYS.reduce((sum, k) => sum + (sportMap.get(k)?.sessions ?? 0), 0)
  const hasSkiing = skiingSeconds > 0

  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">No activities in this period.</p>
  }

  // Insert "Total skiing" after the last skiing row (before Strength)
  const skiingRowKeys = new Set(['crosscountry_classic', 'cr_skate', 'rollerski_classic', 'rollerski_skate', 'treadmill_skiing', 'Skiing'])
  const lastSkiingIdx = rows.reduce((last, row, i) => skiingRowKeys.has(row.key) ? i : last, -1)

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-400 border-b border-[#f0f0f0]">
          <th className="text-left pb-2 font-normal">Sport</th>
          <th className="text-right pb-2 font-normal">Time</th>
          <th className="text-right pb-2 font-normal">Sessions</th>
          <th className="text-right pb-2 font-normal">Share</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#f9f9f9]">
        {rows.map((row, i) => (
          <>
            <tr key={row.key}>
              <td className="py-2 text-gray-700">{row.label}</td>
              <td className="py-2 text-right font-mono text-xs tabular-nums">{formatDuration(row.seconds)}</td>
              <td className="py-2 text-right text-gray-500">{row.sessions}</td>
              <td className="py-2 text-right text-gray-400 text-xs">
                {totalSeconds > 0 ? Math.round((row.seconds / totalSeconds) * 100) : 0}%
              </td>
            </tr>
            {i === lastSkiingIdx && hasSkiing && lastSkiingIdx >= 0 && (
              <tr key="total-skiing" className="border-t border-[#efefef]">
                <td className="py-2 pl-3 text-gray-500 text-xs font-medium">Total skiing</td>
                <td className="py-2 text-right font-mono text-xs tabular-nums text-gray-600">{formatDuration(skiingSeconds)}</td>
                <td className="py-2 text-right text-gray-400 text-xs">{skiingSessions}</td>
                <td className="py-2 text-right text-gray-400 text-xs">
                  {totalSeconds > 0 ? Math.round((skiingSeconds / totalSeconds) * 100) : 0}%
                </td>
              </tr>
            )}
          </>
        ))}
        <tr className="border-t border-[#e5e5e5] font-medium">
          <td className="pt-2 pb-1 text-gray-700">Total</td>
          <td className="pt-2 pb-1 text-right font-mono text-xs tabular-nums">{formatDuration(totalSeconds)}</td>
          <td className="pt-2 pb-1 text-right text-gray-500">{bySport.reduce((s, a) => s + a.sessions, 0)}</td>
          <td className="pt-2 pb-1 text-right text-gray-400 text-xs">100%</td>
        </tr>
      </tbody>
    </table>
  )
}
