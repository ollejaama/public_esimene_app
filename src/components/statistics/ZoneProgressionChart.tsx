'use client'

import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { ZoneProgressionPoint } from '@/lib/analytics/zoneProgression'

interface ZoneProgressionChartProps {
  data: ZoneProgressionPoint[]
  zoneNames: Record<string, string>
}

const ZONE_COLORS: Record<string, string> = {
  z0: '#6b8aa3',
  z1: '#9ab48a',
  z2: '#7a9c66',
  z3: '#c6a24a',
  z4: '#c8703a',
  z5: '#a23b2a',
}

const ZONE_KEYS = ['z0', 'z1', 'z2', 'z3', 'z4', 'z5'] as const

function fmtHours(h: number): string {
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  if (hrs > 0 && min > 0) return `${hrs}h ${min}m`
  if (hrs > 0) return `${hrs}h`
  return `${min}m`
}

function fmtPct(v: number): string {
  return v < 1 ? `${v.toFixed(1)}%` : `${Math.round(v)}%`
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const pt: ZoneProgressionPoint = payload[0]?.payload
  if (!pt || pt.totalHours === 0) return null

  return (
    <div className="bg-atlas-panel border border-atlas-rule" style={{ padding: '10px 12px', minWidth: 160 }}>
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted mb-1.5">{pt.label}</p>
      {ZONE_KEYS.map((k) => {
        const v = pt[k]
        if (v === null) return null
        return (
          <p key={k} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[k] }} />
            <span className="font-mono text-[9px] uppercase text-atlas-muted">{/* label */}</span>
            <span className="font-mono text-[9px] text-atlas-ink ml-auto">{fmtPct(v)}</span>
          </p>
        )
      })}
      <p className="font-mono text-[9px] text-atlas-faint mt-1.5 border-t border-atlas-rule pt-1.5">
        Volume: {fmtHours(pt.totalHours)}
      </p>
    </div>
  )
}

function ZoneTooltip({ active, payload, zoneNames }: any) {
  if (!active || !payload?.length) return null
  const pt: ZoneProgressionPoint = payload[0]?.payload
  if (!pt || pt.totalHours === 0) return null

  return (
    <div className="bg-atlas-panel border border-atlas-rule" style={{ padding: '10px 12px', minWidth: 160 }}>
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted mb-1.5">{pt.label}</p>
      {ZONE_KEYS.map((k) => {
        const v = pt[k]
        if (v === null) return null
        return (
          <p key={k} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[k] }} />
            <span className="font-mono text-[9px] uppercase text-atlas-muted">{zoneNames[k]}</span>
            <span className="font-mono text-[9px] text-atlas-ink ml-auto">{fmtPct(v)}</span>
          </p>
        )
      })}
      <p className="font-mono text-[9px] text-atlas-faint mt-1.5 border-t border-atlas-rule pt-1.5">
        Volume: {fmtHours(pt.totalHours)}
      </p>
    </div>
  )
}

export function ZoneProgressionChart({ data, zoneNames }: ZoneProgressionChartProps) {
  const hasData = data.some((p) => p.totalHours > 0)
  if (!hasData) {
    return <div className="h-52 flex items-center justify-center font-serif italic text-[13px] text-atlas-faint">No data</div>
  }

  const maxVol = Math.max(...data.map((p) => p.totalHours), 0.1)
  const volMax = Math.ceil(maxVol * 1.2) || 1

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ right: 40 }}>
        <CartesianGrid vertical={false} stroke="var(--atlas-rule)" strokeDasharray="2 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: 'var(--atlas-faint)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="pct"
          scale="log"
          domain={[0.1, 100]}
          ticks={[0.1, 0.3, 1, 3, 10, 30, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 9, fill: 'var(--atlas-faint)', fontFamily: '"JetBrains Mono", monospace' }}
          axisLine={false}
          tickLine={false}
          width={36}
          allowDataOverflow
        />
        <YAxis
          yAxisId="vol"
          orientation="right"
          domain={[0, volMax]}
          tickFormatter={(v) => `${v}h`}
          tick={{ fontSize: 9, fill: 'var(--atlas-faint)', fontFamily: '"JetBrains Mono", monospace' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip content={(props) => <ZoneTooltip {...props} zoneNames={zoneNames} />} />
        {ZONE_KEYS.map((k) => (
          <Line
            key={k}
            yAxisId="pct"
            dataKey={k}
            name={zoneNames[k]}
            stroke={ZONE_COLORS[k]}
            strokeWidth={1.5}
            dot={{ r: 2, fill: ZONE_COLORS[k] }}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
        <Line
          yAxisId="vol"
          dataKey="totalHours"
          name="Volume"
          stroke="var(--atlas-ink)"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 3 }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
