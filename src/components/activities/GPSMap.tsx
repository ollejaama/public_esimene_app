'use client'

interface GPSMapProps {
  latlng: [number, number][]
}

export function GPSMap({ latlng }: GPSMapProps) {
  if (!latlng || latlng.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-sm text-gray-400">No GPS data</span>
      </div>
    )
  }

  const WIDTH = 400
  const HEIGHT = 250
  const PADDING = 16

  const lats = latlng.map(([lat]) => lat)
  const lngs = latlng.map(([, lng]) => lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const latRange = maxLat - minLat || 0.001
  const lngRange = maxLng - minLng || 0.001

  // Maintain aspect ratio
  const scaleX = (WIDTH - PADDING * 2) / lngRange
  const scaleY = (HEIGHT - PADDING * 2) / latRange
  const scale = Math.min(scaleX, scaleY)

  function toX(lng: number): number {
    return PADDING + (lng - minLng) * scale
  }
  function toY(lat: number): number {
    // Invert Y axis (higher lat = lower y in SVG)
    return HEIGHT - PADDING - (lat - minLat) * scale
  }

  const points = latlng.map(([lat, lng]) => `${toX(lng)},${toY(lat)}`).join(' ')
  const [startLat, startLng] = latlng[0]
  const [endLat, endLng] = latlng[latlng.length - 1]

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full rounded-lg bg-gray-50"
      style={{ maxHeight: 250 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Start dot */}
      <circle cx={toX(startLng)} cy={toY(startLat)} r="4" fill="#22c55e" />
      {/* End dot */}
      <circle cx={toX(endLng)} cy={toY(endLat)} r="4" fill="#ef4444" />
    </svg>
  )
}
