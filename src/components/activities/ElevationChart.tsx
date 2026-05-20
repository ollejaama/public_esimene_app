'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

interface ElevationChartProps {
  elevationData: number[]
  totalSeconds: number
  highlightIndex?: number
}

function downsample(data: number[], maxPoints: number, totalSeconds: number): { t: number; elev: number }[] {
  const scale = data.length > 0 ? totalSeconds / data.length : 1
  if (data.length <= maxPoints) {
    return data.map((elev, i) => ({ t: Math.round(i * scale), elev }))
  }
  const step = data.length / maxPoints
  const result: { t: number; elev: number }[] = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step)
    result.push({ t: Math.round(idx * scale), elev: data[idx] })
  }
  return result
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

export function ElevationChart({ elevationData, totalSeconds, highlightIndex }: ElevationChartProps) {
  const points = downsample(elevationData, 600, totalSeconds)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7a9c66" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#7a9c66" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--atlas-rule)" strokeDasharray="2 3" />
        <XAxis
          dataKey="t"
          tickFormatter={formatTime}
          tick={{ fontSize: 9, fill: 'var(--atlas-faint)', fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 9, fill: 'var(--atlas-faint)', fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${Math.round(v)}m`}
        />
        <Tooltip
          formatter={(value) => [`${Math.round(Number(value))} m`, 'Elevation']}
          labelFormatter={(t) => formatTime(Number(t))}
          contentStyle={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', border: '1px solid var(--atlas-rule)', background: 'var(--atlas-panel)', borderRadius: 0 }}
        />
        <Area
          type="monotone"
          dataKey="elev"
          stroke="#7a9c66"
          strokeWidth={1.5}
          fill="url(#elevGradient)"
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
        {highlightIndex !== undefined && (
          <ReferenceLine x={highlightIndex} stroke="var(--atlas-muted)" strokeWidth={1} strokeDasharray="3 3" />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
