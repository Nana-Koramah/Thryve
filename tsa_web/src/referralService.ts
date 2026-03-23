import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

function isAlertStillActive(status: string): boolean {
  const s = status.trim().toLowerCase()
  return s !== 'resolved' && s !== 'closed' && s !== 'referred'
}

/** Short text for receiving staff (symptoms / EPDS from recent docs). */
async function buildClinicalHandoffSummary(patientId: string): Promise<string> {
  const parts: string[] = []
  try {
    const ciQ = query(
      collection(db, 'checkIns'),
      where('userId', '==', patientId),
      limit(5),
    )
    const ciSnap = await getDocs(ciQ)
    const rows = ciSnap.docs
      .map((d) => d.data() as Record<string, unknown>)
      .sort((a, b) => {
        const ta = (a.loggedAt as { toDate?: () => Date } | undefined)?.toDate?.()?.getTime() ?? 0
        const tb = (b.loggedAt as { toDate?: () => Date } | undefined)?.toDate?.()?.getTime() ?? 0
        return tb - ta
      })
    for (const r of rows.slice(0, 3)) {
      const sev = typeof r.severity === 'string' ? r.severity : ''
      const sym = Array.isArray(r.symptoms) ? r.symptoms.join(', ') : ''
      if (sym || sev) parts.push(`Check-in (${sev || '—'}): ${sym || '—'}`)
    }
  } catch {
    /* optional */
  }
  try {
    const ppdQ = query(
      collection(db, 'ppdScreenings'),
      where('userId', '==', patientId),
      limit(3),
    )
    const ppdSnap = await getDocs(ppdQ)
    for (const d of ppdSnap.docs) {
      const r = d.data() as Record<string, unknown>
      const score = r.totalScore
      const risk = typeof r.riskLevel === 'string' ? r.riskLevel : ''
      if (typeof score === 'number') parts.push(`EPDS score ${score}${risk ? ` (${risk})` : ''}`)
    }
  } catch {
    /* optional */
  }
  const text = parts.join(' · ')
  return text.length > 1800 ? `${text.slice(0, 1797)}…` : text
}

/**
 * Move the mother’s facility linkage to the chosen hospital, move active alerts to that
 * facility (so their staff see them), and record a referral log with a short clinical handoff.
 */
export async function referPatientToFacility(params: {
  patientId: string
  staffUid: string
  previousFacilityId: string
  previousFacilityName: string
  newFacilityId: string
  newFacilityName: string
}): Promise<void> {
  const {
    patientId,
    staffUid,
    previousFacilityId,
    previousFacilityName,
    newFacilityId,
    newFacilityName,
  } = params

  if (newFacilityId === previousFacilityId) {
    throw new Error('Choose a different facility than the current one.')
  }

  const alertsQ = query(
    collection(db, 'alerts'),
    where('userId', '==', patientId),
    // Rules are not filters: include facility so query only returns docs staff can read.
    where('facilityId', '==', previousFacilityId),
    limit(80),
  )
  const alertsSnap = await getDocs(alertsQ)

  const clinicalHandoffSummary = await buildClinicalHandoffSummary(patientId)

  const batch = writeBatch(db)

  for (const d of alertsSnap.docs) {
    const data = d.data() as Record<string, unknown>
    const fac = typeof data.facilityId === 'string' ? data.facilityId : ''
    const st = typeof data.status === 'string' ? data.status : 'new'
    if (fac !== previousFacilityId || !isAlertStillActive(st)) continue

    batch.update(d.ref, {
      facilityId: newFacilityId,
      status: 'new',
      updatedAt: serverTimestamp(),
      transferredFromFacilityId: previousFacilityId,
      transferredFromFacilityName: previousFacilityName,
      transferredAt: serverTimestamp(),
    })
  }

  const userRef = doc(db, 'users', patientId)
  batch.update(userRef, {
    linkedFacilityId: newFacilityId,
    linkedFacilityName: newFacilityName,
    updatedAt: serverTimestamp(),
  })

  const logRef = doc(collection(db, 'patientReferrals'))
  batch.set(logRef, {
    patientId,
    previousFacilityId,
    previousFacilityName,
    newFacilityId,
    newFacilityName,
    referredByStaffId: staffUid,
    referredAt: serverTimestamp(),
    clinicalHandoffSummary: clinicalHandoffSummary || null,
  })

  await batch.commit()
}
