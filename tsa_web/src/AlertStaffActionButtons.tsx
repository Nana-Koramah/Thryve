import React, { useState } from 'react'
import type { FacilityAlert } from './useAlertsAtFacility'
import { staffUpdateAlertDisposition, type StaffAlertDisposition } from './alertStaffService'

function isTerminalStatus(status: string): boolean {
  const s = status.trim().toLowerCase()
  return s === 'resolved' || s === 'closed' || s === 'referred'
}

export const AlertStaffActionButtons: React.FC<{
  alert: FacilityAlert
  staffUid: string
  /** Tighter layout for table cells */
  compact?: boolean
}> = ({ alert, staffUid, compact }) => {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const s = alert.status.trim().toLowerCase()
  const terminal = isTerminalStatus(alert.status)
  const isNew = s === 'new' || s === ''

  const run = async (disposition: StaffAlertDisposition) => {
    if (!staffUid) return
    setBusy(true)
    setErr(null)
    try {
      await staffUpdateAlertDisposition(alert.id, staffUid, disposition)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const btn =
    'rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'

  if (terminal) {
    return <span className="text-[11px] text-slate-400">No actions</span>
  }

  return (
    <div className={compact ? 'flex flex-col items-stretch gap-1' : 'flex flex-wrap gap-1'}>
      {err ? <span className="text-[10px] text-rose-600">{err}</span> : null}
      {isNew ? (
        <button type="button" className={btn} disabled={busy} onClick={() => run('acknowledged')}>
          Acknowledge
        </button>
      ) : null}
      <button type="button" className={btn} disabled={busy} onClick={() => run('resolved')}>
        Resolve
      </button>
    </div>
  )
}
