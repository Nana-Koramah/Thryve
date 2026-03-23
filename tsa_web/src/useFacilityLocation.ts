import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

/** Greater Accra — used when facility doc has no coordinates. */
export const DEFAULT_MAP_CENTER: [number, number] = [5.6037, -0.187]

function readGeo(data: Record<string, unknown>): { lat: number; lng: number } | null {
  const loc = data.location
  if (loc && typeof loc === 'object' && loc !== null && 'latitude' in loc && 'longitude' in loc) {
    const lat = (loc as { latitude: unknown }).latitude
    const lng = (loc as { longitude: unknown }).longitude
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng }
    }
  }
  const lat = data.latitude
  const lng = data.longitude
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { lat, lng }
  }
  return null
}

/** Facility name + map coordinates from `facilities/{facilityId}` (public read). */
export function useFacilityLocation(facilityId: string | null): {
  facilityName: string
  lat: number
  lng: number
  loading: boolean
  error: string | null
} {
  const [facilityName, setFacilityName] = useState('')
  const [lat, setLat] = useState(DEFAULT_MAP_CENTER[0])
  const [lng, setLng] = useState(DEFAULT_MAP_CENTER[1])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!facilityId) {
      setFacilityName('')
      setLat(DEFAULT_MAP_CENTER[0])
      setLng(DEFAULT_MAP_CENTER[1])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'facilities', facilityId))
        if (cancelled) return
        if (!snap.exists()) {
          setFacilityName('')
          setLat(DEFAULT_MAP_CENTER[0])
          setLng(DEFAULT_MAP_CENTER[1])
          setLoading(false)
          return
        }
        const data = snap.data() as Record<string, unknown>
        const name =
          typeof data.name === 'string'
            ? data.name
            : typeof data.facilityName === 'string'
              ? data.facilityName
              : ''
        const geo = readGeo(data)
        setFacilityName(name)
        if (geo) {
          setLat(geo.lat)
          setLng(geo.lng)
        } else {
          setLat(DEFAULT_MAP_CENTER[0])
          setLng(DEFAULT_MAP_CENTER[1])
        }
        setLoading(false)
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load facility location.')
          setLat(DEFAULT_MAP_CENTER[0])
          setLng(DEFAULT_MAP_CENTER[1])
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [facilityId])

  return { facilityName, lat, lng, loading, error }
}
