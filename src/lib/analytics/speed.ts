const R = 6371000 // Earth radius in meters

function haversineMeters(a: [number, number], b: [number, number]): number {
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const dLat = lat2 - lat1
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Compute speed in km/h from a GPS track.
 * secondsPerSample is the real elapsed time between consecutive GPS points
 * (activitySeconds / latlng.length). Defaults to 1 for 1 Hz tracks.
 * Uses a 7-point centered rolling average to smooth GPS noise.
 */
export function computeSpeedKmh(latlng: [number, number][], secondsPerSample = 1): number[] {
  if (latlng.length < 2) return latlng.map(() => 0)

  // distance (m) / secondsPerSample → m/s, × 3.6 → km/h
  const raw: number[] = [0]
  for (let i = 1; i < latlng.length; i++) {
    raw.push((haversineMeters(latlng[i - 1], latlng[i]) / secondsPerSample) * 3.6)
  }

  // 7-point centered rolling average
  const half = 3
  return raw.map((_, i) => {
    const lo = Math.max(0, i - half)
    const hi = Math.min(raw.length - 1, i + half)
    let sum = 0
    for (let j = lo; j <= hi; j++) sum += raw[j]
    return sum / (hi - lo + 1)
  })
}
