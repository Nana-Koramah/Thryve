import React, { useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import './dashboard.css'
import type { TsaPage } from './App'
import { db } from './firebase'
import { TsaLayout } from './TsaLayout'
import { useStaffWelcome } from './useStaffWelcome'
import {
  alertMatchesPatientSearch,
  type AlertUserSearchMeta,
} from './alertUiUtils'
import {
  alertSourceLabel,
  alertStatusLabel,
  useAlertsAtFacility,
  type FacilityAlert,
} from './useAlertsAtFacility'
import { facilityTableCard, facilityTableToolbar } from './facilityTableClasses'

interface AlertHistoryPageProps {
  onNavigate: (page: TsaPage) => void
  onOpenPatientDetail: (motherUid: string) => void
}

function formatWhen(d: Date | null): string {
  if (!d) return '—'
  try {
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return d.toISOString()
  }
}

function userSearchMetaFromDoc(d: Record<string, unknown> | undefined): AlertUserSearchMeta {
  if (!d) return { fullName: '', ghanaCardId: '', nhisId: '' }
  const fullName = typeof d.fullName === 'string' ? d.fullName.trim() : ''
  const ghanaCardId = typeof d.ghanaCardId === 'string' ? d.ghanaCardId : ''
  const nhisId =
    (typeof d.NhisId === 'string' ? d.NhisId : '') ||
    (typeof d.nhisNumber === 'string' ? d.nhisNumber : '') ||
    (typeof d.nhis === 'string' ? d.nhis : '') ||
    (typeof d.NHIS === 'string' ? d.NHIS : '') ||
    ''
  return { fullName, ghanaCardId, nhisId }
}

function matchesStatusFilter(a: FacilityAlert, f: string): boolean {
  if (f === 'all') return true
  const raw = a.status.trim().toLowerCase()
  const s = raw || 'new'
  if (f === 'new') return s === 'new'
  return s === f
}

export const AlertHistoryPage: React.FC<AlertHistoryPageProps> = ({
  onNavigate,
  onOpenPatientDetail,
}) => {
  const { facilityId, facilityName, loading: staffLoading } = useStaffWelcome()
  const effectiveFacilityId = !staffLoading && facilityId ? facilityId : null
  const { alerts, loading, error } = useAlertsAtFacility(effectiveFacilityId)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userMetaByUid, setUserMetaByUid] = useState<Record<string, AlertUserSearchMeta>>({})

  useEffect(() => {
    const ids = [...new Set(alerts.map((a) => a.userId).filter(Boolean))]
    if (ids.length === 0) {
      setUserMetaByUid({})
      return
    }
    let cancelled = false
    void (async () => {
      const next: Record<string, AlertUserSearchMeta> = {}
      await Promise.all(
        ids.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, 'users', uid))
            next[uid] = userSearchMetaFromDoc(snap.data() as Record<string, unknown> | undefined)
          } catch {
            /* ignore */
          }
        }),
      )
      if (!cancelled) setUserMetaByUid(next)
    })()
    return () => {
      cancelled = true
    }
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    return alerts.filter(
      (a) =>
        matchesStatusFilter(a, statusFilter) &&
        alertMatchesPatientSearch(a, search, userMetaByUid[a.userId]),
    )
  }, [alerts, statusFilter, search, userMetaByUid])

  return (
    <TsaLayout
      navContext="alertHistory"
      onNavigate={onNavigate}
      headerPatientSearch={{
        value: search,
        onChange: setSearch,
        placeholder: 'Search by name, Ghana Card ID, or NHIS…',
      }}
    >
      <main className="px-6 py-8">
        <div className="max-w-7xl w-full flex flex-col gap-5">
          <header>
            <h1 className="text-lg font-semibold text-slate-900">Alert history</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              All <strong>severe check-in</strong> and <strong>high EPDS (≥13)</strong> alerts for
              your facility (newest first). Use the <strong>top bar</strong> to search by name or
              ID; filter by status below.
            </p>
            {facilityName ? (
              <p className="text-xs text-slate-500 mt-2">{facilityName}</p>
            ) : null}
          </header>

          {!effectiveFacilityId && !staffLoading ? (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
              Your staff profile has no <span className="font-mono">facilityId</span>. Link a
              facility to see alert history.
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
          ) : null}

          <section className={facilityTableCard}>
            <div className={`${facilityTableToolbar} justify-end`}>
              <select
                id="alert-history-status"
                aria-label="Filter alerts by status"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 min-w-[12rem] max-w-full focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="new">Awaiting acknowledgement</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
                <option value="referred">Referred</option>
              </select>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading alerts…</div>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 px-4">
                No alerts yet for this facility. They appear when mothers submit a severe check-in
                or an EPDS score of 13+ (with a linked facility).
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 px-4">
                No alerts match your search or status filter. Try clearing the top bar search or
                choosing “All statuses”.
              </div>
            ) : (
              <div className="px-5 sm:px-6 pb-4">
                <div
                  className="w-full grid gap-x-5 gap-y-1 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 items-start text-left"
                  style={{
                    gridTemplateColumns:
                      '10.5rem minmax(0, 1fr) minmax(11rem, 13rem) minmax(12rem, 2.2fr) minmax(5.5rem, max-content)',
                  }}
                >
                  <span className="self-start pt-0.5 text-left">When</span>
                  <span className="self-start pt-0.5 text-left">Mother</span>
                  <span className="self-start pt-0.5 text-left">Type</span>
                  <span className="self-start pt-0.5 text-left">Summary</span>
                  <span className="self-start pt-0.5 text-left whitespace-nowrap">Status</span>
                </div>
                {filteredAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="w-full grid gap-x-5 gap-y-1 py-3 border-t border-slate-100 text-xs items-start text-left"
                    style={{
                      gridTemplateColumns:
                        '10.5rem minmax(0, 1fr) minmax(11rem, 13rem) minmax(12rem, 2.2fr) minmax(5.5rem, max-content)',
                    }}
                  >
                    <div className="self-start min-w-0 text-xs text-slate-600 leading-snug tabular-nums">
                      {formatWhen(a.createdAt)}
                    </div>
                    <div className="self-start min-w-0 text-left">
                      <div className="font-medium text-slate-900 text-xs leading-snug">
                        {a.motherName || 'Unknown'}
                      </div>
                      {a.userId ? (
                        <button
                          type="button"
                          className="text-[11px] text-tsa-accent-blue hover:underline mt-1 block text-left"
                          onClick={() => onOpenPatientDetail(a.userId)}
                        >
                          Open profile
                        </button>
                      ) : null}
                    </div>
                    <div className="self-start min-w-0 text-xs text-slate-700 leading-snug">
                      {alertSourceLabel(a.source)}
                    </div>
                    <div className="self-start min-w-0 text-xs text-slate-600 leading-snug">
                      {a.summary || '—'}
                    </div>
                    <div className="self-start shrink-0 text-left">
                      <span
                        className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight ${
                          a.status === 'new' || !a.status.trim()
                            ? 'bg-amber-100 text-amber-900'
                            : a.status.toLowerCase() === 'acknowledged'
                              ? 'bg-slate-100 text-slate-800'
                              : a.status.toLowerCase() === 'referred'
                                ? 'bg-violet-50 text-violet-900'
                                : ['resolved', 'closed'].includes(a.status.toLowerCase())
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {alertStatusLabel(a.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </TsaLayout>
  )
}
