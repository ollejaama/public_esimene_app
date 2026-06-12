'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { WeekSummary } from '@/lib/analytics/weekSummary'
import { formatDuration } from '@/lib/analytics/hrZones'
import { SPORT_BREAKDOWN_ROWS, SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'

const SKIING_KEYS = ['crosscountry_classic', 'cr_skate', 'rollerski_classic', 'rollerski_skate', 'treadmill_classic', 'treadmill_skate', 'Skiing']

function getSportColor(key: string): string {
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

interface SportBreakdownPieProps {
  bySport: WeekSummary['bySport']
}

export function SportBreakdownPie({ bySport }: SportBreakdownPieProps) {
  const sportMap = new Map(bySport.map((s) => [s.key, s]))
  const totalSeconds = bySport.reduce((sum, s) => sum + s.seconds, 0)

  const rows = SPORT_BREAKDOWN_ROWS
    .map((row) => {
      const data = sportMap.get(row.key)
      return data ? { ...row, seconds: data.seconds } : null
    })
    .filter((r): r is NonNullable<typeof r> => r !== null && r.seconds > 0)

  if (rows.length === 0) {
    return <p className="font-serif italic text-[13px] text-atlas-faint">No activities in this period.</p>
  }

  const pieData = rows.map((row) => ({
    name: row.label,
    key: row.key,
    value: row.seconds,
    color: getSportColor(row.key),
  }))

  const skiingSeconds = SKIING_KEYS.reduce((sum, k) => sum + (sportMap.get(k)?.seconds ?? 0), 0)
  const skiingRowKeys = new Set(SKIING_KEYS)
  const hasSkiing = skiingSeconds > 0 && rows.some((r) => skiingRowKeys.has(r.key))
  const lastSkiingIdx = rows.reduce((last, row, i) => skiingRowKeys.has(row.key) ? i : last, -1)

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={72}
            paddingAngle={1}
            strokeWidth={0}
          >
            {pieData.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const secs = typeof value === 'number' ? value : 0
              return [
                `${formatDuration(secs)} · ${totalSeconds > 0 ? Math.round((secs / totalSeconds) * 100) : 0}%`,
                name as string,
              ]
            }}
            contentStyle={{
              background: 'var(--atlas-panel)',
              border: '1px solid var(--atlas-rule)',
              borderRadius: 0,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
            labelStyle={{ display: 'none' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2">
        {rows.map((row, i) => {
          const color = getSportColor(row.key)
          const pct = totalSeconds > 0 ? Math.round((row.seconds / totalSeconds) * 100) : 0
          return (
            <div key={row.key}>
              <div className="flex items-baseline justify-between py-[7px] border-b border-dotted border-atlas-rule">
                <span className="font-serif text-[14px] leading-none flex items-center gap-2">
                  <span className="w-[9px] h-[9px] flex-shrink-0 inline-block" style={{ backgroundColor: color }} />
                  {row.label}
                </span>
                <span className="font-mono text-[11px] text-atlas-muted tracking-[0.05em]">
                  {formatDuration(row.seconds)} · {pct}%
                </span>
              </div>
              {i === lastSkiingIdx && hasSkiing && (
                <div className="flex items-baseline justify-between py-[7px] border-b border-dotted border-atlas-rule">
                  <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted pl-4">Total skiing</span>
                  <span className="font-mono text-[11px] text-atlas-muted">
                    {formatDuration(skiingSeconds)} · {totalSeconds > 0 ? Math.round((skiingSeconds / totalSeconds) * 100) : 0}%
                  </span>
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
    </div>
  )
}
