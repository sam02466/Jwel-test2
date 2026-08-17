import { useEffect, useRef } from 'react'
import L from 'leaflet'

/**
 * Renders a delivery destination pin and, optionally, the assigned
 * agent's live position — with a line between them once both exist.
 *
 * The map itself is created once and never torn down on a coordinate
 * update; only the markers move. The previous version recreated the
 * whole Leaflet map every time `coords` changed, which — now that the
 * agent's position can update every ~15s during live tracking — would
 * have reset pan/zoom and visibly flashed on every ping.
 */
export default function OrderMap({ destination, agentPosition, label, agentLabel = 'Delivery agent', className = 'h-72 w-full' }) {
  const divRef = useRef(null)
  const mapRef = useRef(null)
  const destMarkerRef = useRef(null)
  const agentMarkerRef = useRef(null)
  const lineRef = useRef(null)

  // Create the map once.
  useEffect(() => {
    if (!divRef.current || mapRef.current) return
    const map = L.map(divRef.current, { zoomControl: true }).setView(
      destination ? [destination.lat, destination.lng] : agentPosition ? [agentPosition.lat, agentPosition.lng] : [22.5726, 88.3639],
      13
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      destMarkerRef.current = null
      agentMarkerRef.current = null
      lineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the destination marker (and view) in sync.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!destination) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove()
        destMarkerRef.current = null
      }
      return
    }

    const pos = [destination.lat, destination.lng]
    if (!destMarkerRef.current) {
      const icon = L.divIcon({
        className: '',
        html: `<div class="delivery-pin"><span class="delivery-pin-dot"></span></div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44]
      })
      destMarkerRef.current = L.marker(pos, { icon }).addTo(map)
      if (label) destMarkerRef.current.bindPopup(`<strong style="font-family:Jost,sans-serif">${label}</strong>`)
      if (!agentPosition) map.setView(pos, 14)
    } else {
      destMarkerRef.current.setLatLng(pos)
    }
  }, [destination?.lat, destination?.lng, label])

  // Keep the agent's live marker in sync, independently — this is the
  // one that moves every ~15s while a delivery is in progress.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!agentPosition) {
      if (agentMarkerRef.current) {
        agentMarkerRef.current.remove()
        agentMarkerRef.current = null
      }
      if (lineRef.current) {
        lineRef.current.remove()
        lineRef.current = null
      }
      return
    }

    const pos = [agentPosition.lat, agentPosition.lng]
    if (!agentMarkerRef.current) {
      const icon = L.divIcon({
        className: '',
        html: `<div class="agent-pin"><span class="agent-pin-dot"></span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
      agentMarkerRef.current = L.marker(pos, { icon, zIndexOffset: 500 }).addTo(map)
      agentMarkerRef.current.bindPopup(`<strong style="font-family:Jost,sans-serif">${agentLabel}</strong>`)
    } else {
      agentMarkerRef.current.setLatLng(pos)
    }

    if (destination) {
      const linePoints = [pos, [destination.lat, destination.lng]]
      if (!lineRef.current) {
        lineRef.current = L.polyline(linePoints, { color: '#B08D57', weight: 2, dashArray: '6 8', opacity: 0.7 }).addTo(map)
      } else {
        lineRef.current.setLatLngs(linePoints)
      }
      map.fitBounds(lineRef.current.getBounds(), { padding: [48, 48], maxZoom: 15 })
    } else {
      map.setView(pos, 14)
    }
  }, [agentPosition?.lat, agentPosition?.lng, agentLabel, destination?.lat, destination?.lng])

  if (!destination && !agentPosition) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl border border-champagne-200/70 bg-champagne-50/60 text-center text-sm text-espresso-500`}>
        Location not available yet.
      </div>
    )
  }

  return <div ref={divRef} className={className} />
}
