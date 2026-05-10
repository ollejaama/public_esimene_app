'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

interface SpeedLineChartProps {
  speedData: number[]   // km/h values, one per second
  isRunning: boolean    // true → display as min/km pace, false → km/h
  highlightIndex?: number
}

function rollingAverage(data: number[], window: number): number[] {
  const half = Math.floor(window / 2)
  return data.map((_, i) => {
    const lo = Math.max(0, i - half)
    const hi = Math.min(data.length - 1, i + half)
    const slice = data.slice(lo, hi + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

function downsample(data: number[], maxPoints: number): { t: number; v: number }[] {
  if (data.length <= maxPoints) {
    return data.map((v, i) => ({ t: i, v }))
  }
  const step = data.length / maxPoints
  const result: { t: number; v: number }[] = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step)
    result.push({ t: idx, v: data[idx] })
  }
  return result
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

function formatPaceValue(minPerKm: number): string {
  const m = Math.floor(minPerKm)
  const s = Math.round((minPerKm - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function SpeedLineChart({ speedData, isRunning, highlightIndex }: SpeedLineChartProps) {
  const smoothed = rollingAverage(speedData, 25)
  const rawPoints = downsample(smoothed, 600)

  // For running, convert km/h to min/km (pace). Clamp absurd values (e.g. GPS jumps).
  const points = isRunning
    ? rawPoints.map(({ t, v }) => ({
        t,
        v: v > 0 ? Math.min(60 / v, 30) : 30, // min/km, capped at 30 min/km
      }))
    : rawPoints

  const yDomain: [number | string, number | string] = isRunning ? ['auto', 'auto'] : [0, 'auto']

  // Y-axis tick formatter
  const tickFormatter = isRunning
    ? (v: number) => formatPaceValue(v)
    : (v: number) => `${v.toFixed(0)}`

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
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
          domain={yDomain}
          reversed={isRunning}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={tickFormatter}
        />
        <Tooltip
          formatter={(value) =>
            isRunning
              ? [`${formatPaceValue(Number(value))} /km`, 'Pace']
              : [`${Number(value).toFixed(1)} km/h`, 'Speed']
          }
          labelFormatter={(t) => formatTime(Number(t))}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e5e5' }}
        />
        <Line
          type="monotone"
          dataKey="v"
          stroke="#3b82f6"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        {highlightIndex !== undefined && (
          <ReferenceLine x={highlightIndex} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
