'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

interface ElevationChartProps {
  elevationData: number[]
  highlightIndex?: number
}

function downsample(data: number[], maxPoints: number): { t: number; elev: number }[] {
  if (data.length <= maxPoints) {
    return data.map((elev, i) => ({ t: i, elev }))
  }
  const step = data.length / maxPoints
  const result: { t: number; elev: number }[] = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step)
    result.push({ t: idx, elev: data[idx] })
  }
  return result
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

export function ElevationChart({ elevationData, highlightIndex }: ElevationChartProps) {
  const points = downsample(elevationData, 600)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity={1} />
            <stop offset="100%" stopColor="#bbf7d0" stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="t"
          tickFormatter={formatTime}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${Math.round(v)}m`}
        />
        <Tooltip
          formatter={(value) => [`${Math.round(Number(value))} m`, 'Elevation']}
          labelFormatter={(t) => formatTime(Number(t))}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e5e5' }}
        />
        <Area
          type="monotone"
          dataKey="elev"
          stroke="#16a34a"
          strokeWidth={1.5}
          fill="url(#elevGradient)"
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
        {highlightIndex !== undefined && (
          <ReferenceLine x={highlightIndex} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
