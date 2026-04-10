'use client'

import dynamic from 'next/dynamic'

interface LeafletMapProps {
  latlng: [number, number][]
}

// Inner component — loaded client-side only (Leaflet requires DOM)
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), { ssr: false })

export function LeafletMap({ latlng }: LeafletMapProps) {
  if (latlng.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-[#f9f9f9] rounded text-xs text-gray-400">
        No GPS data
      </div>
    )
  }

  return <LeafletMapInner latlng={latlng} />
}
