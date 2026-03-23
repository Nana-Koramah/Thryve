import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

/** Staff-only alert outcomes (Firestore `alerts.status`). Referring to another hospital uses `referPatientToFacility`, not this. */
export type StaffAlertDisposition = 'acknowledged' | 'resolved'

export async function staffUpdateAlertDisposition(
  alertId: string,
  staffUid: string,
  disposition: StaffAlertDisposition,
  note?: string,
): Promise<void> {
  const ref = doc(db, 'alerts', alertId)
  const patch: Record<string, unknown> = {
    status: disposition,
    updatedAt: serverTimestamp(),
  }
  if (disposition === 'resolved') {
    patch.resolvedAt = serverTimestamp()
    patch.resolvedByStaffId = staffUid
  }
  if (note?.trim()) {
    patch.staffResolutionNote = note.trim()
  }
  await updateDoc(ref, patch)
}
