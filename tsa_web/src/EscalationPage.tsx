import React, { useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import './dashboard.css'
import type { TsaPage } from './App'
import {
  alertNeedsAcknowledgement,
  alertSourceShort,
  isAlertActiveOnOpsBoard,
  useAlertsAtFacility,
  type FacilityAlert,
} from './useAlertsAtFacility'

function hasAlertHomeCoords(a: FacilityAlert): boolean {
  return (
    typeof a.motherHomeLat === 'number' &&
    typeof a.motherHomeLng === 'number' &&
    Number.isFinite(a.motherHomeLat) &&
    Number.isFinite(a.motherHomeLng)
  )
}
import {
  alertMatchesPatientSearch,
  alertPriorityCategory,
  alertPriorityLabel,
  alertPriorityPillClass,
  type AlertPriorityFilter,
  type AlertUserSearchMeta,
  elapsedOpenTimeClassCompact,
  elapsedVisualTier,
  formatElapsedSince,
  offsetAlertMarker,
} from './alertUiUtils'
import {
  facilityTableCard,
  facilityTableFluid,
  facilityTheadRow,
  facilityTh,
  facilityThFirst,
  facilityThLast,
  facilityTbody,
  facilityTr,
  facilityTd,
  facilityTdLast,
  facilityTdTopFirst,
  facilityPatientNameEscalation,
  facilityPatientSubEscalation,
  facilityTableActionLinkEscalation,
  facilityTableToolbar,
} from './facilityTableClasses'
import { EscalationMap, type EscalationMapMarker } from './EscalationMap'
import { TsaLayout } from './TsaLayout'
import { useStaffWelcome } from './useStaffWelcome'
import { useFacilityLocation } from './useFacilityLocation'

type EscalationUserProfile = AlertUserSearchMeta & {
  home?: { lat: number; lng: number }
}

function userProfileFromDoc(d: Record<string, unknown> | undefined): EscalationUserProfile {
  if (!d) return { fullName: '', ghanaCardId: '', nhisId: '' }
  const fullName = typeof d.fullName === 'string' ? d.fullName.trim() : ''
  const ghanaCardId = typeof d.ghanaCardId === 'string' ? d.ghanaCardId : ''
  const nhisId =
    (typeof d.NhisId === 'string' ? d.NhisId : '') ||
    (typeof d.nhisNumber === 'string' ? d.nhisNumber : '') ||
    (typeof d.nhis === 'string' ? d.nhis : '') ||
    (typeof d.NHIS === 'string' ? d.NHIS : '') ||
    ''
  const lat = d.homeLatitude
  const lng = d.homeLongitude
  let home: { lat: number; lng: number } | undefined
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    home = { lat, lng }
  }
  return { fullName, ghanaCardId, nhisId, home }
}

export const EscalationPage: React.FC<{
  onNavigate: (page: TsaPage) => void
  /** Open the mother’s full profile (symptoms, PPD, IDs) from this alert. */
  onManageCase: (motherUserId: string) => void
}> = ({ onNavigate, onManageCase }) => {
  const { facilityId, facilityName, loading: staffLoading } = useStaffWelcome()
  const effectiveFacilityId = !staffLoading && facilityId ? facilityId : null
  const { alerts, loading: alertsLoading, error: alertsError } =
    useAlertsAtFacility(effectiveFacilityId)
  const {
    lat: facLat,
    lng: facLng,
    facilityName: facilityGeoName,
    loading: geoLoading,
    error: geoError,
  } = useFacilityLocation(effectiveFacilityId)

  const opsBoard = useMemo(() => {
    return alerts.filter(isAlertActiveOnOpsBoard).sort((a, b) => {
      const ta = a.createdAt?.getTime() ?? 0
      const tb = b.createdAt?.getTime() ?? 0
      return tb - ta
    })
  }, [alerts])

  const [alertSearch, setAlertSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<AlertPriorityFilter>('all')

  const [userProfileByUid, setUserProfileByUid] = useState<
    Record<string, EscalationUserProfile>
  >({})

  useEffect(() => {
    const ids = [...new Set(opsBoard.map((a) => a.userId).filter(Boolean))]
    if (ids.length === 0) {
      setUserProfileByUid({})
      return
    }

    let cancelled = false
    void (async () => {
      const next: Record<string, EscalationUserProfile> = {}
      await Promise.all(
        ids.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, 'users', uid))
            next[uid] = userProfileFromDoc(snap.data() as Record<string, unknown> | undefined)
          } catch {
            /* per-user read failed */
          }
        }),
      )
      if (!cancelled) setUserProfileByUid(next)
    })()

    return () => {
      cancelled = true
    }
  }, [opsBoard])

  const filteredOpsBoard = useMemo(() => {
    let rows = opsBoard
    if (priorityFilter !== 'all') {
      rows = rows.filter((a) => alertPriorityCategory(a) === priorityFilter)
    }
    rows = rows.filter((a) =>
      alertMatchesPatientSearch(a, alertSearch, userProfileByUid[a.userId]),
    )
    return rows
  }, [opsBoard, priorityFilter, alertSearch, userProfileByUid])

  const needsAckCount = useMemo(
    () => opsBoard.filter(alertNeedsAcknowledgement).length,
    [opsBoard],
  )

  const mapMarkers: EscalationMapMarker[] = useMemo(() => {
    return filteredOpsBoard.map((a, index) => {
      let lat: number
      let lng: number
      if (hasAlertHomeCoords(a)) {
        lat = a.motherHomeLat as number
        lng = a.motherHomeLng as number
      } else if (a.userId && userProfileByUid[a.userId]?.home) {
        const h = userProfileByUid[a.userId].home!
        lat = h.lat
        lng = h.lng
      } else {
        ;[lat, lng] = offsetAlertMarker(index, facLat, facLng)
      }
      return {
        id: a.id,
        lat,
        lng,
        title: a.motherName || 'Mother',
        summary:
          (a.summary || '—').length > 120
            ? `${(a.summary || '').slice(0, 120)}…`
            : a.summary || '—',
        priority: alertPriorityLabel(a),
        typeShort: alertSourceShort(a.source),
      }
    })
  }, [filteredOpsBoard, facLat, facLng, userProfileByUid])

  const displayFacility = facilityName || facilityGeoName || 'Your facility'
  const tableLoading = staffLoading || alertsLoading

  return (
    <TsaLayout
      navContext="escalations"
      onNavigate={onNavigate}
      headerPatientSearch={{
        value: alertSearch,
        onChange: setAlertSearch,
        placeholder: 'Search by name, Ghana Card ID, or NHIS…',
      }}
    >
      <main className="tsa-main tsa-main--escalation">
        <section className="tsa-escalation-left">
          <header className="tsa-page-header">
            <div />
            <div className="tsa-escalation-metrics">
              <div className="tsa-escalation-metric">
                <div className="tsa-metric-label">Needs acknowledgement</div>
                <div className="tsa-metric-value">
                  {!effectiveFacilityId && !staffLoading ? '—' : tableLoading ? '…' : needsAckCount}
                </div>
                <div className="tsa-metric-caption">From Live Feed</div>
              </div>
              <div className="tsa-escalation-metric">
                <div className="tsa-metric-label">Active incidents</div>
                <div className="tsa-metric-value">
                  {!effectiveFacilityId && !staffLoading ? '—' : tableLoading ? '…' : opsBoard.length}
                </div>
                <div className="tsa-metric-caption">Unresolved at your facility</div>
              </div>
            </div>
          </header>

          {!effectiveFacilityId && !staffLoading ? (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              Your staff profile has no <span className="font-mono">facilityId</span>. Link a
              facility to load alerts.
            </p>
          ) : null}

          {alertsError ? (
            <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2 mb-3">
              {alertsError}
            </p>
          ) : null}

          <section className={`${facilityTableCard} min-w-0`}>
            <div className={`${facilityTableToolbar} justify-end`}>
              <select
                id="esc-priority-filter"
                aria-label="Filter alerts by priority"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 min-w-[11rem] max-w-full focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as AlertPriorityFilter)}
              >
                <option value="all">All priorities</option>
                <option value="critical">Critical</option>
                <option value="high_epds">High (EPDS)</option>
                <option value="moderate">Moderate</option>
              </select>
            </div>

            <div className="min-w-0">
              {tableLoading ? (
                <div className="py-16 text-center text-sm text-slate-500">Loading alerts…</div>
              ) : opsBoard.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <p className="text-sm font-medium text-slate-700">No active incidents</p>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    Severe check-ins and high EPDS (≥13) appear here when mothers are linked to{' '}
                    {displayFacility}.
                  </p>
                </div>
              ) : filteredOpsBoard.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <p className="text-sm font-medium text-slate-700">No matching alerts</p>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    Try a different priority, or clear / adjust the search in the top bar (name,
                    Ghana Card ID, or NHIS).
                  </p>
                </div>
              ) : (
                <table className={facilityTableFluid}>
                  <colgroup>
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '14%' }} />
                  </colgroup>
                  <thead>
                    <tr className={facilityTheadRow}>
                      <th scope="col" className={`${facilityThFirst} align-bottom`}>
                        Patient
                      </th>
                      <th scope="col" className={`${facilityTh} align-bottom`}>
                        Facility
                      </th>
                      <th scope="col" className={`${facilityTh} align-bottom`}>
                        Open
                      </th>
                      <th scope="col" className={`${facilityTh} align-bottom`}>
                        Priority
                      </th>
                      <th scope="col" className={`${facilityThLast} text-left align-bottom`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={facilityTbody}>
                    {filteredOpsBoard.map((a) => {
                      const tier = elapsedVisualTier(a.createdAt)
                      return (
                        <tr key={a.id} className={facilityTr}>
                          <td className={`${facilityTdTopFirst} min-w-0`}>
                            <div className={`${facilityPatientNameEscalation} break-words`}>
                              {a.motherName || 'Unknown'}
                            </div>
                            <div className={facilityPatientSubEscalation}>
                              {alertSourceShort(a.source)}
                            </div>
                          </td>
                          <td
                            className={`${facilityTd} text-slate-800 align-top break-words text-xs leading-snug hyphens-auto`}
                          >
                            {displayFacility}
                          </td>
                          <td className={`${facilityTd} align-top`}>
                            <span className={elapsedOpenTimeClassCompact(tier)}>
                              {formatElapsedSince(a.createdAt)}
                            </span>
                          </td>
                          <td className={`${facilityTd} align-top`}>
                            <span className={alertPriorityPillClass(a)}>
                              {alertPriorityLabel(a)}
                            </span>
                          </td>
                          <td className={`${facilityTdLast} align-top`}>
                            <button
                              type="button"
                              className={`${facilityTableActionLinkEscalation} text-left`}
                              disabled={!a.userId}
                              title={
                                !a.userId
                                  ? 'This alert has no linked patient user id'
                                  : undefined
                              }
                              onClick={() => onManageCase(a.userId)}
                            >
                              Manage Case
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </section>

        <aside className="tsa-escalation-right">
          <section className="tsa-card tsa-reroute-card tsa-facility-context-card">
            <header className="tsa-card-header tsa-card-header--space-between">
              <span className="tsa-detail-section-title">Facility context</span>
            </header>
            <div className="tsa-reroute-details">
              <div className="tsa-reroute-row">
                <span className="tsa-reroute-label">Facility</span>
                <span className="tsa-reroute-value">{displayFacility}</span>
              </div>
              <div className="tsa-reroute-row">
                <span className="tsa-reroute-label">Map anchor</span>
                <span className="tsa-reroute-value text-xs font-normal">
                  {geoLoading
                    ? 'Loading coordinates…'
                    : geoError
                      ? 'Using default (Accra) — check facility doc'
                      : 'From facilities document'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 px-1 pb-2 leading-relaxed">
              Pins use the mother’s <strong>geocoded home address</strong> when available (saved
              after she enters it on the app). Otherwise we load coords from her profile or fall
              back to spread markers around your facility.
            </p>
            <div className="tsa-reroute-actions">
              <button
                type="button"
                className="tsa-secondary-button tsa-secondary-button--full"
                onClick={() => onNavigate('live')}
              >
                Live Feed
              </button>
              <button
                type="button"
                className="tsa-secondary-button tsa-secondary-button--full"
                onClick={() => onNavigate('alertHistory')}
              >
                Alert history
              </button>
            </div>
          </section>

          <section className="tsa-card tsa-escalation-map-card">
            <EscalationMap markers={mapMarkers} facilityLabel={displayFacility} />
          </section>
        </aside>
      </main>
    </TsaLayout>
  )
}
