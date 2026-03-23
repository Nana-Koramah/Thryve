import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

function timestampToDate(v: unknown): Date | null {
  if (v == null) return null
  if (typeof v === 'object' && v !== null && 'toDate' in v) {
    const d = (v as { toDate: () => Date }).toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
  }
  return null
}

export type ClinicalNoteRow = {
  id: string
  patientId: string
  facilityId: string
  /** Display name of the facility where the note was written (optional on older docs). */
  facilityName: string
  authorId: string
  authorDisplayName: string
  content: string
  createdAt: Date | null
}

export function useClinicalNotes(
  patientId: string | null,
  facilityId: string | null,
): {
  notes: ClinicalNoteRow[]
  loading: boolean
  error: string | null
  addNote: (
    content: string,
    authorDisplayName: string,
    authorId: string,
    recordingFacilityName?: string,
  ) => Promise<void>
  addError: string | null
} {
  const [notes, setNotes] = useState<ClinicalNoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId || !facilityId) {
      setNotes([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    // Single equality on patientId only — no composite index required (Firestore default).
    // Rules allow all notes for this patient while she is linked to your facility (incl. notes from
    // prior facilities after referral). Sort newest first in the client.
    const q = query(
      collection(db, 'clinicalNotes'),
      where('patientId', '==', patientId),
      limit(200),
    )

    let unsub: Unsubscribe | undefined
    try {
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: ClinicalNoteRow[] = snap.docs
            .map((d) => {
              const data = d.data() as Record<string, unknown>
              return {
                id: d.id,
                patientId: typeof data.patientId === 'string' ? data.patientId : '',
                facilityId: typeof data.facilityId === 'string' ? data.facilityId : '',
                facilityName:
                  typeof data.facilityName === 'string' ? data.facilityName.trim() : '',
                authorId: typeof data.authorId === 'string' ? data.authorId : '',
                authorDisplayName:
                  typeof data.authorDisplayName === 'string' ? data.authorDisplayName : 'Staff',
                content: typeof data.content === 'string' ? data.content : '',
                createdAt: timestampToDate(data.createdAt),
              }
            })
            .sort(
              (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
            )
          setNotes(rows)
          setLoading(false)
        },
        (err) => {
          setError(err.message || 'Unable to load clinical notes.')
          setNotes([])
          setLoading(false)
        },
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to subscribe to clinical notes.')
      setNotes([])
      setLoading(false)
    }

    return () => {
      unsub?.()
    }
  }, [patientId, facilityId])

  const addNote = async (
    content: string,
    authorDisplayName: string,
    authorId: string,
    recordingFacilityName?: string,
  ) => {
    if (!patientId || !facilityId) return
    const trimmed = content.trim()
    if (!trimmed) return
    setAddError(null)
    try {
      const name = (recordingFacilityName ?? '').trim()
      await addDoc(collection(db, 'clinicalNotes'), {
        patientId,
        facilityId,
        ...(name ? { facilityName: name } : {}),
        authorId,
        authorDisplayName: authorDisplayName.trim() || 'Staff',
        content: trimmed,
        createdAt: serverTimestamp(),
      })
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Could not save note.')
      throw e
    }
  }

  return { notes, loading, error, addNote, addError }
}
