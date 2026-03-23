import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DEFAULT_MAP_CENTER } from './useFacilityLocation'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

export type EscalationMapMarker = {
  id: string
  lat: number
  lng: number
  title: string
  summary: string
  priority: string
  typeShort: string
}

function MapBounds({ markers }: { markers: EscalationMapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) {
      map.setView(DEFAULT_MAP_CENTER, 11)
      return
    }
    const b = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as L.LatLngTuple))
    b.pad(0.2)
    map.fitBounds(b, { maxZoom: 13, padding: [24, 24] })
  }, [map, markers])
  return null
}

export const EscalationMap: React.FC<{
  markers: EscalationMapMarker[]
  /** Shown when there are no alert markers. */
  facilityLabel?: string
}> = ({ markers, facilityLabel }) => {
  const center = useMemo((): [number, number] => {
    if (markers.length === 0) return DEFAULT_MAP_CENTER
    const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length
    const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length
    return [lat, lng]
  }, [markers])

  return (
    <div className="tsa-escalation-map-wrap">
      <MapContainer
        center={center}
        zoom={markers.length === 0 ? 11 : 12}
        className="tsa-escalation-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds markers={markers} />
        {markers.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>
              <strong>{loc.title}</strong>
              <div className="text-xs mt-1 opacity-90">{loc.typeShort}</div>
              <div className="text-xs mt-1">{loc.summary}</div>
              <div className="tsa-map-popup-priority mt-1">{loc.priority}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {markers.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-end justify-center pb-3 px-2">
          <p className="text-xs text-slate-700 bg-white/90 rounded-lg px-2 py-1 shadow-sm text-center max-w-[90%]">
            {facilityLabel
              ? `No open alerts to plot. Pins use your facility location (${facilityLabel}) when alerts exist.`
              : 'No alerts to show on the map yet.'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
