'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

interface ZoneBoundaries {
  zone1_max: number
  zone2_max: number
  zone3_max: number
  zone4_max: number
}

interface HRLineChartProps {
  hrData: number[]
  totalSeconds: number
  zoneBoundaries?: ZoneBoundaries
  highlightIndex?: number
}

const DEFAULT_BOUNDARIES: ZoneBoundaries = { zone1_max: 130, zone2_max: 148, zone3_max: 162, zone4_max: 174 }

// Downsample to at most maxPoints; t is scaled to actual elapsed seconds
function downsample(data: number[], maxPoints: number, totalSeconds: number): { t: number; bpm: number }[] {
  const scale = data.length > 0 ? totalSeconds / data.length : 1
  if (data.length <= maxPoints) {
    return data.map((bpm, i) => ({ t: Math.round(i * scale), bpm }))
  }
  const step = data.length / maxPoints
  const result: { t: number; bpm: number }[] = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step)
    result.push({ t: Math.round(idx * scale), bpm: data[idx] })
  }
  return result
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

function zoneColorAt(bpm: number, z1: number, z2: number, z3: number, z4: number): string {
  if (bpm > z4) return '#a23b2a'
  if (bpm > z3) return '#c8703a'
  if (bpm > z2) return '#c6a24a'
  if (bpm > z1) return '#7a9c66'
  if (bpm > 99) return '#9ab48a'
  return '#6b8aa3'
}

function buildGradientStops(
  domainMin: number,
  domainMax: number,
  { zone1_max: z1, zone2_max: z2, zone3_max: z3, zone4_max: z4 }: ZoneBoundaries
): { offset: string; color: string }[] {
  const range = domainMax - domainMin
  if (range <= 0) return [{ offset: '0%', color: zoneColorAt(domainMax, z1, z2, z3, z4) }]

  const toOffset = (bpm: number) =>
    `${(((domainMax - bpm) / range) * 100).toFixed(1)}%`

  // Zone boundaries from highest to lowest; only include those within the visible domain
  const boundaries = [z4, z3, z2, z1, 99].filter((b) => b > domainMin && b < domainMax)

  const stops: { offset: string; color: string }[] = []
  stops.push({ offset: '0%', color: zoneColorAt(domainMax, z1, z2, z3, z4) })
  for (const b of boundaries) {
    // Place stop just below the boundary to represent the zone below it
    stops.push({ offset: toOffset(b), color: zoneColorAt(b - 0.1, z1, z2, z3, z4) })
  }
  stops.push({ offset: '100%', color: zoneColorAt(domainMin, z1, z2, z3, z4) })
  return stops
}

export function HRLineChart({ hrData, totalSeconds, zoneBoundaries, highlightIndex }: HRLineChartProps) {
  const boundaries = zoneBoundaries ?? DEFAULT_BOUNDARIES
  const points = downsample(hrData, 600, totalSeconds)

  // Compute explicit domain from data so gradient stops align perfectly
  const validBpm = hrData.filter((b) => b > 0)
  const rawMin = validBpm.length > 0 ? Math.min(...validBpm) : 60
  const rawMax = hrData.length > 0 ? Math.max(...hrData) : 180
  const domainMin = Math.max(0, Math.floor(rawMin / 10) * 10)
  const domainMax = Math.ceil(rawMax / 10) * 10

  const stops = buildGradientStops(domainMin, domainMax, boundaries)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
            {stops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} stopOpacity={1} />
            ))}
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
          domain={[domainMin, domainMax]}
          tick={{ fontSize: 9, fill: 'var(--atlas-faint)', fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
          width={32}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          formatter={(value) => [`${value} bpm`, 'HR']}
          labelFormatter={(t) => formatTime(Number(t))}
          contentStyle={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', border: '1px solid var(--atlas-rule)', background: 'var(--atlas-panel)', borderRadius: 0 }}
        />
        <Area
          type="monotone"
          dataKey="bpm"
          stroke="var(--atlas-ink)"
          strokeWidth={1.5}
          fill="url(#hrGradient)"
          fillOpacity={0.75}
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
