import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import './dashboard.css'
import type { TsaPage } from './App'
import { db } from './firebase'
import { TsaLayout } from './TsaLayout'
import { useStaffWelcome } from './useStaffWelcome'
import { useMothersAtFacility } from './useMothersAtFacility'
import { useLatestCheckInByUser } from './useLatestCheckInByUser'
import { formatElapsedSince } from './alertUiUtils'
import {
  alertNeedsAcknowledgement,
  alertSourceShort,
  useAlertsAtFacility,
} from './useAlertsAtFacility'
import {
  facilityTableCard,
  facilityTableScroll,
  facilityTable,
  facilityTheadRow,
  facilityThFirst,
  facilityTh,
  facilityThLast,
  facilityTbody,
  facilityTr,
  facilityTd,
  facilityTdLast,
  facilityTdTop,
  facilityPatientName,
  facilityPatientSubline,
} from './facilityTableClasses'

const ViewIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12C4.5 8.5 7.5 6 12 6C16.5 6 19.5 8.5 21 12C19.5 15.5 16.5 18 12 18C7.5 18 4.5 15.5 3 12Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const PhoneIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M6.5 4.5L9 4L10.5 7L9 8.5C9.75 10.5 11.5 12.25 13.5 13L15 11.5L18 13L17.5 15.5C17.37 16.09 16.89 16.5 16.28 16.5C11.58 16.25 7.75 12.42 7.5 7.72C7.5 7.11 7.91 6.63 8.5 6.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ChatIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 18L4 20V7C4 5.9 4.9 5 6 5H18C19.1 5 20 5.9 20 7V13C20 14.1 19.1 15 18 15H8L6 18Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function formatRelativeUpdate(d: Date): string {
  const diff = Math.max(0, Date.now() - d.getTime())
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function lastActivityDate(
  profileAt: Date | null,
  checkInMs: number | undefined,
): Date | null {
  const p = profileAt?.getTime() ?? 0
  const c = checkInMs ?? 0
  const max = Math.max(p, c)
  return max > 0 ? new Date(max) : null
}

interface DashboardPageProps {
  onNavigate: (page: TsaPage) => void
  onOpenPatientDetail: (motherUid: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenPatientDetail,
}) => {
  const { facilityId, facilityName, loading: staffLoading } = useStaffWelcome()
  const effectiveFacilityId = !staffLoading && facilityId ? facilityId : null
  const { mothers, loading: mothersLoading, error: mothersError } =
    useMothersAtFacility(effectiveFacilityId)
  const { latestLoggedAtMsByUserId } = useLatestCheckInByUser(effectiveFacilityId)
  const { alerts, loading: alertsLoading, error: alertsError } =
    useAlertsAtFacility(effectiveFacilityId)

  const [patientSearch, setPatientSearch] = useState('')
  const filteredMothers = useMemo(() => {
    const q = patientSearch.trim().toLowerCase()
    if (!q) return mothers
    const compact = q.replace(/\s+/g, '')
    return mothers.filter((m) => {
      const name = m.fullName.toLowerCase()
      const gha = m.ghanaCardId.toLowerCase().replace(/\s+/g, '')
      const nhis = m.nhisId.toLowerCase().replace(/\s+/g, '')
      return (
        name.includes(q) ||
        (compact.length > 0 && (gha.includes(compact) || nhis.includes(compact)))
      )
    })
  }, [mothers, patientSearch])

  const tableLoading = staffLoading || mothersLoading
  const newAlerts = alerts.filter(alertNeedsAcknowledgement)
  const activeRedFlagCount = newAlerts.length

  const [, setElapsedTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setElapsedTick((n) => n + 1), 30000)
    return () => window.clearInterval(id)
  }, [])

  const [ackError, setAckError] = useState<string | null>(null)
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAckError(null)
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'acknowledged',
        updatedAt: serverTimestamp(),
      })
    } catch (e: unknown) {
      setAckError(e instanceof Error ? e.message : 'Could not acknowledge alert.')
    }
  }, [])

  return (
    <TsaLayout
      navContext="live"
      onNavigate={onNavigate}
      headerPatientSearch={{
        value: patientSearch,
        onChange: setPatientSearch,
        placeholder: 'Search by name, Ghana Card ID, or NHIS…',
      }}
    >
      <main className="px-6 py-8">
        <div className="max-w-7xl w-full grid grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] gap-10">
          <section className="flex flex-col gap-5">
            <section className="grid grid-cols-3 gap-6">
              <article className="bg-white rounded-card shadow-card px-4 py-3.5">
                <div className="text-xs text-slate-500">Mothers linked</div>
                <div className="mt-1 text-2xl font-semibold">
                  {tableLoading ? '…' : mothers.length}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 truncate">
                  {facilityName || 'Your facility'}
                </div>
              </article>

              <article className="bg-white rounded-card shadow-card px-4 py-3.5">
                <div className="text-xs text-slate-500">Active red flags</div>
                <div className="mt-1 text-2xl font-semibold">
                  {!effectiveFacilityId && !staffLoading
                    ? '—'
                    : staffLoading || alertsLoading
                      ? '…'
                      : activeRedFlagCount}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Awaiting acknowledgement
                </div>
              </article>

              <article className="bg-white rounded-card shadow-card px-4 py-3.5">
                <div className="text-xs text-slate-500">Avg. triage response</div>
                <div className="mt-1 text-2xl font-semibold">—</div>
                <div className="mt-1 text-[11px] text-slate-500">Coming soon</div>
              </article>
            </section>

            <section className={facilityTableCard}>
              {!effectiveFacilityId && !staffLoading ? (
                <p className="text-sm text-amber-800 bg-amber-50 m-4 rounded-xl px-4 py-3">
                  Your staff profile has no <span className="font-mono">facilityId</span>. Link a
                  facility in onboarding so mothers can appear here.
                </p>
              ) : null}

              {mothersError ? (
                <p className="text-sm text-rose-700 bg-rose-50 m-4 rounded-xl px-4 py-3">
                  {mothersError}
                </p>
              ) : null}

              {alertsError ? (
                <p className="text-sm text-rose-700 bg-rose-50 m-4 rounded-xl px-4 py-3">
                  Alerts: {alertsError}
                </p>
              ) : null}

              <div className={facilityTableScroll}>
                {tableLoading ? (
                  <div className="py-16 text-center text-sm text-slate-500">Loading patients…</div>
                ) : mothers.length === 0 ? (
                  <div className="py-16 px-6 text-center">
                    <p className="text-sm font-medium text-slate-700">No linked mothers yet</p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      When mothers choose your facility in the app, they will appear here.
                    </p>
                  </div>
                ) : filteredMothers.length === 0 ? (
                  <div className="py-16 px-6 text-center">
                    <p className="text-sm font-medium text-slate-700">No matches</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Nothing matches “{patientSearch.trim()}”. Try name, Ghana Card ID, or NHIS
                      number.
                    </p>
                  </div>
                ) : (
                  <table className={`${facilityTable} min-w-[640px]`}>
                    <thead>
                      <tr className={facilityTheadRow}>
                        <th scope="col" className={`${facilityThFirst} min-w-[140px]`}>
                          Patient
                        </th>
                        <th scope="col" className={`${facilityTh} w-[100px]`}>
                          Status
                        </th>
                        <th scope="col" className={`${facilityTh} min-w-[200px]`}>
                          Summary
                        </th>
                        <th scope="col" className={`${facilityTh} w-[120px]`}>
                          Last update
                        </th>
                        <th scope="col" className={`${facilityThLast} w-[132px] text-right`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={facilityTbody}>
                      {filteredMothers.map((m) => (
                        <tr key={m.id} className={facilityTr}>
                          <td className={`${facilityTdTop} pl-5 pr-4 min-w-0 max-w-[240px]`}>
                            <div className={facilityPatientName}>{m.fullName}</div>
                            {m.nhisId ? (
                              <div
                                className={`mt-1.5 flex min-w-0 items-baseline gap-2 ${facilityPatientSubline}`}
                              >
                                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  NHIS
                                </span>
                                <span className="truncate font-mono text-slate-600 tabular-nums">
                                  {m.nhisId}
                                </span>
                              </div>
                            ) : (
                              <p className={`mt-1.5 italic text-slate-400 ${facilityPatientSubline}`}>
                                No NHIS on file
                              </p>
                            )}
                          </td>
                          <td className={facilityTd}>
                            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-800 ring-1 ring-inset ring-sky-100">
                              Linked
                            </span>
                          </td>
                          <td className={`${facilityTdTop} min-w-[160px]`}>
                            {m.phone ? (
                              <p className="text-[13px] leading-snug text-slate-600">
                                Phone {m.phone}
                              </p>
                            ) : null}
                            {m.postpartumDuration ? (
                              <p
                                className={
                                  m.phone
                                    ? 'mt-1 text-[13px] leading-snug text-slate-600'
                                    : 'text-[13px] leading-snug text-slate-600'
                                }
                              >
                                {m.postpartumDuration}
                              </p>
                            ) : null}
                            {!m.phone && !m.postpartumDuration ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : null}
                          </td>
                          <td className={facilityTd}>
                            {(() => {
                              const last = lastActivityDate(
                                m.profileUpdatedAt,
                                latestLoggedAtMsByUserId[m.id],
                              )
                              return last ? (
                                <span
                                  className="text-xs text-slate-600 tabular-nums"
                                  title={last.toLocaleString()}
                                >
                                  {formatRelativeUpdate(last)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )
                            })()}
                          </td>
                          <td className={`${facilityTdLast} text-right`}>
                            <div className="inline-flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-600 transition hover:border-slate-200 hover:bg-white hover:text-slate-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                                aria-label={`Open profile for ${m.fullName}`}
                                onClick={() => onOpenPatientDetail(m.id)}
                              >
                                <ViewIcon />
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-300 cursor-not-allowed"
                                aria-label="Call patient (coming soon)"
                                disabled
                                title="Coming soon"
                              >
                                <PhoneIcon />
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-300 cursor-not-allowed"
                                aria-label="Open chat (coming soon)"
                                disabled
                                title="Coming soon"
                              >
                                <ChatIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="bg-white rounded-card shadow-card p-4 flex flex-col gap-3">
              <header className="flex items-center justify-between">
                <span className="text-sm font-semibold">Red Flags</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">
                  LIVE
                </span>
              </header>

              {ackError ? (
                <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-2 py-1.5">{ackError}</p>
              ) : null}

              {!effectiveFacilityId && !staffLoading ? (
                <p className="text-xs text-slate-500">
                  Link your facility to see alerts from mothers at your site.
                </p>
              ) : alertsLoading ? (
                <div className="text-sm text-slate-500 py-4 text-center">Loading alerts…</div>
              ) : newAlerts.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">
                  No red flags awaiting acknowledgement.
                </div>
              ) : (
                newAlerts.slice(0, 5).map((a) => {
                  const name = a.motherName || 'Mother'
                  const high = a.severity.toLowerCase() === 'high'
                  const elapsed = formatElapsedSince(a.createdAt)
                  const isPpd = a.source === 'ppd_screening'
                  const isCheckIn = a.source === 'check_in'
                  return (
                    <article
                      key={a.id}
                      className={
                        high
                          ? 'rounded-[14px] px-3.5 py-3 bg-gradient-to-r from-rose-500 to-rose-400 text-rose-50'
                          : 'rounded-[14px] px-3.5 py-3 border border-slate-200 bg-slate-50'
                      }
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <div className={`font-semibold ${high ? '' : 'text-slate-900'}`}>{name}</div>
                          <div className="mt-1.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                                high
                                  ? 'bg-white/30 text-white'
                                  : isPpd
                                    ? 'bg-violet-100 text-violet-900'
                                    : isCheckIn
                                      ? 'bg-rose-100 text-rose-900'
                                      : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {alertSourceShort(a.source)}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-semibold ${high ? '' : 'text-slate-700'}`}
                          title="Time since alert"
                        >
                          {elapsed}
                        </div>
                      </div>
                      <p
                        className={`text-xs mb-2.5 line-clamp-4 ${high ? '' : 'text-slate-700'}`}
                      >
                        {a.summary || '—'}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          className={
                            high
                              ? 'w-full rounded-full bg-amber-100 text-amber-900 text-sm font-semibold py-2'
                              : 'w-full rounded-full border border-slate-200 bg-white text-slate-800 text-sm font-medium py-2'
                          }
                          onClick={() => acknowledgeAlert(a.id)}
                        >
                          Acknowledge
                        </button>
                        {a.userId ? (
                          <button
                            type="button"
                            className={
                              high
                                ? 'w-full rounded-full border border-rose-200/60 bg-rose-500/20 text-rose-50 text-xs font-medium py-1.5'
                                : 'w-full rounded-full border border-slate-200 bg-white text-xs font-medium py-1.5 text-slate-700'
                            }
                            onClick={() => onOpenPatientDetail(a.userId)}
                          >
                            Open patient profile
                          </button>
                        ) : null}
                      </div>
                    </article>
                  )
                })
              )}
            </section>
          </aside>
        </div>
      </main>
    </TsaLayout>
  )
}
