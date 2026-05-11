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
  z0: '#94a3b8',
  z1: '#4ade80',
  z2: '#86efac',
  z3: '#facc15',
  z4: '#fb923c',
  z5: '#ef4444',
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
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 text-xs shadow-sm min-w-[160px]">
      <p className="font-medium text-gray-700 mb-2">{pt.label}</p>
      {ZONE_KEYS.map((k) => {
        const v = pt[k]
        if (v === null) return null
        return (
          <p key={k} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[k] }} />
            <span className="text-gray-500 w-6">{/* zoneNames passed via closure in parent */}</span>
            <span className="font-medium">{fmtPct(v)}</span>
          </p>
        )
      })}
      <p className="text-gray-400 mt-1.5 border-t border-[#f0f0f0] pt-1.5">
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
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 text-xs shadow-sm min-w-[160px]">
      <p className="font-medium text-gray-700 mb-2">{pt.label}</p>
      {ZONE_KEYS.map((k) => {
        const v = pt[k]
        if (v === null) return null
        return (
          <p key={k} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[k] }} />
            <span className="text-gray-500">{zoneNames[k]}:</span>
            <span className="font-medium">{fmtPct(v)}</span>
          </p>
        )
      })}
      <p className="text-gray-400 mt-1.5 border-t border-[#f0f0f0] pt-1.5">
        Volume: {fmtHours(pt.totalHours)}
      </p>
    </div>
  )
}

export function ZoneProgressionChart({ data, zoneNames }: ZoneProgressionChartProps) {
  const hasData = data.some((p) => p.totalHours > 0)
  if (!hasData) {
    return <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data</div>
  }

  const maxVol = Math.max(...data.map((p) => p.totalHours), 0.1)
  const volMax = Math.ceil(maxVol * 1.2) || 1

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ right: 40 }}>
        <CartesianGrid vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="pct"
          scale="log"
          domain={[0.1, 100]}
          ticks={[0.1, 0.3, 1, 3, 10, 30, 100]}
          tickFormatter={(v) => v >= 1 ? `${v}%` : `${v}%`}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
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
          tick={{ fontSize: 10, fill: '#9ca3af' }}
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
          stroke="#374151"
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
