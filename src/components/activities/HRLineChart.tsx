'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

interface HRLineChartProps {
  hrData: number[]
  highlightIndex?: number
}

// Downsample to at most maxPoints, keeping start and end
function downsample(data: number[], maxPoints: number): { t: number; bpm: number }[] {
  if (data.length <= maxPoints) {
    return data.map((bpm, i) => ({ t: i, bpm }))
  }
  const step = data.length / maxPoints
  const result: { t: number; bpm: number }[] = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step)
    result.push({ t: idx, bpm: data[idx] })
  }
  return result
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

export function HRLineChart({ hrData, highlightIndex }: HRLineChartProps) {
  const points = downsample(hrData, 600)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ef4444" stopOpacity={1} />
            <stop offset="25%"  stopColor="#fb923c" stopOpacity={1} />
            <stop offset="50%"  stopColor="#facc15" stopOpacity={1} />
            <stop offset="75%"  stopColor="#86efac" stopOpacity={1} />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity={1} />
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
          width={32}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          formatter={(value) => [`${value} bpm`, 'HR']}
          labelFormatter={(t) => formatTime(Number(t))}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e5e5' }}
        />
        <Area
          type="monotone"
          dataKey="bpm"
          stroke="#ef4444"
          strokeWidth={1.5}
          fill="url(#hrGradient)"
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
