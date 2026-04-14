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
 * Compute per-second speed in km/h from a GPS track sampled at 1 Hz.
 * Uses a 7-point centered rolling average to smooth GPS noise.
 */
export function computeSpeedKmh(latlng: [number, number][]): number[] {
  if (latlng.length < 2) return latlng.map(() => 0)

  // Instantaneous speed: distance between consecutive points (meters) = m/s at 1 Hz
  const raw: number[] = [0]
  for (let i = 1; i < latlng.length; i++) {
    raw.push(haversineMeters(latlng[i - 1], latlng[i]) * 3.6) // m/s → km/h
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
