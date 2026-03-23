import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import { initialsFromDisplayName } from './useStaffWelcome'

export type MotherRow = {
  id: string
  fullName: string
  ghanaCardId: string
  nhisId: string
  phone: string
  linkedFacilityName: string
  linkedFacilityId: string
  postpartumDuration: string
  heightCm: string
  email: string
  initials: string
  /** From `users.updatedAt` — profile / app saves */
  profileUpdatedAt: Date | null
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function timestampToDate(v: unknown): Date | null {
  if (v == null) return null
  if (typeof v === 'object' && v !== null && 'toDate' in v) {
    const d = (v as { toDate: () => Date }).toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
  }
  return null
}

/** Live mothers linked to the same facility as the signed-in staff (`linkedFacilityId` on `users`). */
export function useMothersAtFacility(facilityId: string | null): {
  mothers: MotherRow[]
  loading: boolean
  error: string | null
} {
  const [mothers, setMothers] = useState<MotherRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!facilityId) {
      setMothers([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const q = query(
      collection(db, 'users'),
      where('linkedFacilityId', '==', facilityId),
    )

    let unsub: Unsubscribe | undefined
    try {
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: MotherRow[] = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>
            const fullName = asString(data.fullName).trim() || 'Unknown'
            const nhis =
              asString(data.NhisId) ||
              asString(data.nhisNumber) ||
              asString(data.nhis) ||
              asString(data.NHIS) ||
              ''
            return {
              id: d.id,
              fullName,
              ghanaCardId: asString(data.ghanaCardId),
              nhisId: nhis,
              phone: asString(data.phone),
              linkedFacilityName: asString(data.linkedFacilityName),
              linkedFacilityId: asString(data.linkedFacilityId),
              postpartumDuration: asString(data.postpartumDuration),
              heightCm: asString(data.heightCm),
              email: asString(data.email),
              initials: initialsFromDisplayName(fullName),
              profileUpdatedAt:
                timestampToDate(data.updatedAt) ?? timestampToDate(data.createdAt),
            }
          })
          rows.sort((a, b) => a.fullName.localeCompare(b.fullName))
          setMothers(rows)
          setLoading(false)
        },
        (err) => {
          setError(err.message || 'Unable to load mothers for this facility.')
          setMothers([])
          setLoading(false)
        },
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to subscribe to mothers list.')
      setMothers([])
      setLoading(false)
    }

    return () => {
      if (unsub) unsub()
    }
  }, [facilityId])

  return { mothers, loading, error }
}
