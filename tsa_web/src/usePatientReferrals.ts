import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  limit,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export type PatientReferralRow = {
  id: string
  patientId: string
  previousFacilityId: string
  previousFacilityName: string
  newFacilityId: string
  newFacilityName: string
  referredByStaffId: string
  referredAt: Date | null
  clinicalHandoffSummary: string | null
}

function asDate(v: unknown): Date | null {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as Timestamp).toDate === 'function') {
    try {
      return (v as Timestamp).toDate()
    } catch {
      return null
    }
  }
  return null
}

/** Staff / patient: history of facility referrals (handoff context). */
export function usePatientReferrals(patientId: string | null): {
  rows: PatientReferralRow[]
  loading: boolean
  error: string | null
} {
  const [rows, setRows] = useState<PatientReferralRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId) {
      setRows([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, 'patientReferrals'),
      where('patientId', '==', patientId),
      limit(100),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: PatientReferralRow[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>
          return {
            id: d.id,
            patientId: typeof data.patientId === 'string' ? data.patientId : '',
            previousFacilityId:
              typeof data.previousFacilityId === 'string' ? data.previousFacilityId : '',
            previousFacilityName:
              typeof data.previousFacilityName === 'string' ? data.previousFacilityName : '',
            newFacilityId: typeof data.newFacilityId === 'string' ? data.newFacilityId : '',
            newFacilityName: typeof data.newFacilityName === 'string' ? data.newFacilityName : '',
            referredByStaffId:
              typeof data.referredByStaffId === 'string' ? data.referredByStaffId : '',
            referredAt: asDate(data.referredAt),
            clinicalHandoffSummary:
              typeof data.clinicalHandoffSummary === 'string' ? data.clinicalHandoffSummary : null,
          }
        })
        next.sort((a, b) => (b.referredAt?.getTime() ?? 0) - (a.referredAt?.getTime() ?? 0))
        setRows(next)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Unable to load referrals.')
        setRows([])
        setLoading(false)
      },
    )

    return () => unsub()
  }, [patientId])

  return { rows, loading, error }
}
