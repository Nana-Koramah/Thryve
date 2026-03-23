import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export type FacilityOption = {
  id: string
  name: string
  region: string
}

export function useFacilitiesList(): {
  facilities: FacilityOption[]
  loading: boolean
  error: string | null
} {
  const [facilities, setFacilities] = useState<FacilityOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const snap = await getDocs(collection(db, 'facilities'))
        if (cancelled) return
        const rows: FacilityOption[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>
          return {
            id: d.id,
            name: typeof data.name === 'string' ? data.name : d.id,
            region: typeof data.region === 'string' ? data.region : '',
          }
        })
        rows.sort((a, b) => a.name.localeCompare(b.name))
        setFacilities(rows)
        setError(null)
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unable to load facilities.')
          setFacilities([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { facilities, loading, error }
}
