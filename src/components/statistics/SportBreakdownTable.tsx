import { WeekSummary } from '@/lib/analytics/weekSummary'
import { formatDuration } from '@/lib/analytics/hrZones'
import { SPORT_BREAKDOWN_ROWS, SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'

const SKIING_KEYS = ['crosscountry_classic', 'cr_skate', 'rollerski_classic', 'rollerski_skate', 'treadmill_classic', 'treadmill_skate', 'Skiing']

function getSportColor(key: string): string {
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

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
    return <p className="font-serif italic text-[13px] text-atlas-faint">No activities in this period.</p>
  }

  const skiingRowKeys = new Set(['crosscountry_classic', 'cr_skate', 'rollerski_classic', 'rollerski_skate', 'treadmill_classic', 'treadmill_skate', 'Skiing'])
  const lastSkiingIdx = rows.reduce((last, row, i) => skiingRowKeys.has(row.key) ? i : last, -1)
  const maxSeconds = Math.max(...rows.map((r) => r.seconds))

  return (
    <div>
      {rows.map((row, i) => {
        const color = getSportColor(row.key)
        const pct = totalSeconds > 0 ? Math.round((row.seconds / totalSeconds) * 100) : 0
        const barPct = maxSeconds > 0 ? (row.seconds / maxSeconds) * 100 : 0

        return (
          <div key={row.key}>
            <div className="py-[9px] border-b border-dotted border-atlas-rule">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="font-serif text-[16px] leading-none flex items-center gap-2">
                  <span className="w-[9px] h-[9px] flex-shrink-0 inline-block" style={{ backgroundColor: color }} />
                  {row.label}
                </span>
                <span className="font-mono text-[11px] text-atlas-muted tracking-[0.05em]">
                  {formatDuration(row.seconds)} · {pct}%
                </span>
              </div>
              <div className="h-1 atlas-stat-block relative">
                <div className="absolute inset-0" style={{ width: `${barPct}%`, backgroundColor: color, opacity: 0.85 }} />
              </div>
            </div>
            {i === lastSkiingIdx && hasSkiing && lastSkiingIdx >= 0 && (
              <div key="total-skiing" className="py-[9px] border-b border-dotted border-atlas-rule">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted pl-4">Total skiing</span>
                  <span className="font-mono text-[11px] text-atlas-muted">
                    {formatDuration(skiingSeconds)} · {totalSeconds > 0 ? Math.round((skiingSeconds / totalSeconds) * 100) : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="mt-3 pt-2.5 border-t border-atlas-rule flex justify-between font-mono text-[10px] tracking-[0.12em] uppercase text-atlas-muted">
        <span>Total</span>
        <span>{formatDuration(totalSeconds)} · {bySport.reduce((s, a) => s + a.sessions, 0)} sessions</span>
      </div>
    </div>
  )
}
