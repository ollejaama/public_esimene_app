'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  latlng: [number, number][]
  highlightIndex?: number
}

function FitBounds({ positions }: { positions: L.LatLngTuple[] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [20, 20] })
    }
  }, [map, positions])
  return null
}

export default function LeafletMapInner({ latlng, highlightIndex }: Props) {
  const positions: L.LatLngTuple[] = latlng.map(([lat, lng]) => [lat, lng])
  const center: L.LatLngTuple = positions[0] ?? [0, 0]

  const highlightPos =
    highlightIndex !== undefined && highlightIndex >= 0 && highlightIndex < positions.length
      ? positions[highlightIndex]
      : null

  return (
    <div style={{ height: 300, borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#3b82f6" weight={3} />
        {/* Start marker */}
        {positions.length > 0 && (
          <CircleMarker center={positions[0]} radius={6} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }} />
        )}
        {/* End marker */}
        {positions.length > 1 && (
          <CircleMarker center={positions[positions.length - 1]} radius={6} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }} />
        )}
        {/* Slider position marker */}
        {highlightPos && (
          <CircleMarker center={highlightPos} radius={5} pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 1 }} />
        )}
        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  )
}
