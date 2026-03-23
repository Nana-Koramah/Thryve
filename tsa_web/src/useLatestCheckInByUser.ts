import { useEffect, useState } from 'react'
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

function timestampToMs(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'object' && v !== null && 'toDate' in v) {
    const d = (v as { toDate: () => Date }).toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : 0
  }
  return 0
}

/** Latest `checkIns.loggedAt` per user for mothers at this facility (client merge). */
export function useLatestCheckInByUser(facilityId: string | null): {
  latestLoggedAtMsByUserId: Record<string, number>
  loading: boolean
  error: string | null
} {
  const [map, setMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!facilityId) {
      setMap({})
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const q = query(
      collection(db, 'checkIns'),
      where('facilityId', '==', facilityId),
      limit(500),
    )

    let unsub: Unsubscribe | undefined
    try {
      unsub = onSnapshot(
        q,
        (snap) => {
          const next: Record<string, number> = {}
          for (const d of snap.docs) {
            const data = d.data() as Record<string, unknown>
            const uid = typeof data.userId === 'string' ? data.userId : ''
            if (!uid) continue
            const t = Math.max(
              timestampToMs(data.loggedAt),
              timestampToMs(data.createdAt),
            )
            if (t > 0 && (!next[uid] || t > next[uid])) next[uid] = t
          }
          setMap(next)
          setLoading(false)
        },
        (err) => {
          setError(err.message || 'Unable to load check-in activity.')
          setMap({})
          setLoading(false)
        },
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to subscribe to check-ins.')
      setMap({})
      setLoading(false)
    }

    return () => unsub?.()
  }, [facilityId])

  return { latestLoggedAtMsByUserId: map, loading, error }
}
