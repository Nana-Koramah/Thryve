import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons in Vite/bundlers (use string paths for compatibility)
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

/** Dummy red-flag alert locations in Greater Accra */
const ALERT_LOCATIONS = [
  { id: '1', lat: 5.5667, lng: -0.2, label: 'Adabraka PolyClinic', priority: 'Critical' },
  { id: '2', lat: 5.581, lng: -0.195, label: 'Ridge Hospital Annex', priority: 'High' },
  { id: '3', lat: 5.5431, lng: -0.2133, label: 'Korle-Bu District Center', priority: 'Borderline' },
  { id: '4', lat: 5.6698, lng: -0.0167, label: 'Tema General Hospital', priority: 'Critical' },
  { id: '5', lat: 5.65, lng: -0.15, label: 'East Legon CHPS', priority: 'High' },
  { id: '6', lat: 5.555, lng: -0.205, label: 'Osu Maternity Home', priority: 'Moderate' },
]

const GREATER_ACCRA_CENTER: [number, number] = [5.6037, -0.187]

function MapBounds() {
  const map = useMap()
  useEffect(() => {
    const b = L.latLngBounds(ALERT_LOCATIONS.map((a) => [a.lat, a.lng] as L.LatLngTuple))
    b.pad(0.15)
    map.fitBounds(b, { maxZoom: 11 })
  }, [map])
  return null
}

export const EscalationMap: React.FC = () => {
  return (
    <div className="tsa-escalation-map-wrap">
      <MapContainer
        center={GREATER_ACCRA_CENTER}
        zoom={10}
        className="tsa-escalation-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds />
        {ALERT_LOCATIONS.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>
              <strong>{loc.label}</strong>
              <br />
              <span className="tsa-map-popup-priority">{loc.priority}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
