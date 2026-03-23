import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function asFiniteNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function timestampToDate(v: unknown): Date | null {
  if (v == null) return null
  if (typeof v === 'object' && v !== null && 'toDate' in v) {
    const d = (v as { toDate: () => Date }).toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
  }
  return null
}

export type FacilityAlert = {
  id: string
  userId: string
  facilityId: string
  source: string
  severity: string
  status: string
  summary: string
  motherName: string
  createdAt: Date | null
  payload: Record<string, unknown>
  /** Geocoded home at time of alert (optional; from mobile). */
  motherHomeLat: number | null
  motherHomeLng: number | null
}

/** Human-readable alert origin (matches mobile `source` on `alerts`). */
export function alertSourceLabel(source: string): string {
  if (source === 'ppd_screening') return 'PPD / EPDS (high risk — score ≥ 13)'
  if (source === 'check_in') return 'Check-in (severe symptoms)'
  return source ? source : 'Unknown'
}

/** Short label for Live Feed badges (not “low” PPD — high EPDS ≥ 13). */
export function alertSourceShort(source: string): string {
  if (source === 'ppd_screening') return 'High EPDS (≥13)'
  if (source === 'check_in') return 'Severe check-in'
  return 'Alert'
}

/** Needs staff first response (Live Feed stat + sidebar). */
export function alertNeedsAcknowledgement(a: FacilityAlert): boolean {
  const s = a.status.trim().toLowerCase()
  return s === 'new' || s === ''
}

/** Still on the ops board (map + escalations table) — not closed out. */
export function isAlertActiveOnOpsBoard(a: FacilityAlert): boolean {
  const s = a.status.trim().toLowerCase()
  return s !== 'resolved' && s !== 'closed' && s !== 'referred'
}

export function alertStatusLabel(status: string): string {
  const s = status.trim().toLowerCase()
  if (s === 'new' || s === '') return 'Awaiting acknowledgement'
  if (s === 'acknowledged') return 'Acknowledged'
  if (s === 'resolved') return 'Resolved'
  if (s === 'closed') return 'Closed'
  if (s === 'referred') return 'Referred'
  return status || '—'
}

/** Alerts for the signed-in staff's facility (`facilityId` on each alert doc). */
export function useAlertsAtFacility(facilityId: string | null): {
  alerts: FacilityAlert[]
  loading: boolean
  error: string | null
} {
  const [alerts, setAlerts] = useState<FacilityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!facilityId) {
      setAlerts([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const q = query(
      collection(db, 'alerts'),
      where('facilityId', '==', facilityId),
    )

    let unsub: Unsubscribe | undefined
    try {
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: FacilityAlert[] = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>
            const payload =
              data.payload != null &&
              typeof data.payload === 'object' &&
              !Array.isArray(data.payload)
                ? (data.payload as Record<string, unknown>)
                : {}
            const motherName = asString(payload.motherName).trim()
            return {
              id: d.id,
              userId: asString(data.userId),
              facilityId: asString(data.facilityId),
              source: asString(data.source),
              severity: asString(data.severity),
              status: asString(data.status) || 'new',
              summary: asString(data.summary),
              motherName,
              createdAt: timestampToDate(data.createdAt),
              payload,
              motherHomeLat: asFiniteNumber(data.motherHomeLat),
              motherHomeLng: asFiniteNumber(data.motherHomeLng),
            }
          })
          rows.sort((a, b) => {
            const ta = a.createdAt?.getTime() ?? 0
            const tb = b.createdAt?.getTime() ?? 0
            return tb - ta
          })
          setAlerts(rows)
          setLoading(false)
        },
        (err) => {
          setError(err.message || 'Unable to load alerts for this facility.')
          setAlerts([])
          setLoading(false)
        },
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to subscribe to alerts.')
      setAlerts([])
      setLoading(false)
    }

    return () => {
      if (unsub) unsub()
    }
  }, [facilityId])

  return { alerts, loading, error }
}
