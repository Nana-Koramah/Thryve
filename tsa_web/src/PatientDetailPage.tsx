import React, { useEffect, useMemo, useState } from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { TsaLayout } from './TsaLayout'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { initialsFromDisplayName, useStaffWelcome } from './useStaffWelcome'
import { usePatientClinicalData } from './usePatientClinicalData'
import { useAlertsAtFacility, alertStatusLabel } from './useAlertsAtFacility'
import { useClinicalNotes } from './useClinicalNotes'
import { AlertStaffActionButtons } from './AlertStaffActionButtons'
import { useFacilitiesList } from './useFacilitiesList'
import { usePatientReferrals } from './usePatientReferrals'
import { referPatientToFacility } from './referralService'

interface PatientDetailPageProps {
  motherUid: string | null
  /** Sidebar / back target after leaving this profile */
  backPage: TsaPage
  onNavigate: (page: TsaPage) => void
}

function formatWhen(d: Date | null): string {
  if (!d) return '—'
  try {
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export const PatientDetailPage: React.FC<PatientDetailPageProps> = ({
  motherUid,
  backPage,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [ghanaCardId, setGhanaCardId] = useState('')
  const [phone, setPhone] = useState('')
  const [postpartumDuration, setPostpartumDuration] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [linkedFacilityName, setLinkedFacilityName] = useState('')
  const [linkedFacilityId, setLinkedFacilityId] = useState('')
  const [nhis, setNhis] = useState('')
  const [homeAddress, setHomeAddress] = useState('')

  const {
    facilityId,
    facilityName: staffFacilityName,
    uid: staffUid,
    displayName: staffDisplayName,
  } = useStaffWelcome()
  const { facilities: facilityOptions, loading: facilitiesLoading, error: facilitiesError } =
    useFacilitiesList()
  const {
    rows: referralHistory,
    loading: referralsLoading,
    error: referralsError,
  } = usePatientReferrals(motherUid)
  const [referTargetId, setReferTargetId] = useState('')
  const [referBusy, setReferBusy] = useState(false)
  const [referErr, setReferErr] = useState<string | null>(null)
  const { alerts: facilityAlerts, loading: facilityAlertsLoading } = useAlertsAtFacility(
    facilityId || null,
  )
  const patientAlerts = useMemo(() => {
    if (!motherUid) return []
    return facilityAlerts
      .filter((a) => a.userId === motherUid)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
  }, [facilityAlerts, motherUid])

  const {
    notes: clinicalNotes,
    loading: notesLoading,
    error: notesError,
    addNote,
    addError,
  } = useClinicalNotes(motherUid, facilityId || null)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const {
    checkIns,
    ppdScreenings,
    moodLogs,
    mealLogs,
    timeline,
    loading: clinicalLoading,
    error: clinicalError,
  } = usePatientClinicalData(motherUid)

  const latestPpdWithScore = useMemo(
    () => ppdScreenings.find((p) => p.totalScore != null) ?? ppdScreenings[0] ?? null,
    [ppdScreenings],
  )

  useEffect(() => {
    if (!motherUid) {
      setLoading(false)
      setError(null)
      setFullName('')
      setGhanaCardId('')
      setPhone('')
      setPostpartumDuration('')
      setHeightCm('')
      setLinkedFacilityName('')
      setLinkedFacilityId('')
      setNhis('')
      setHomeAddress('')
      return
    }

    setLoading(true)
    setError(null)
    const ref = doc(db, 'users', motherUid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setError('Patient record not found.')
          setLoading(false)
          return
        }
        const data = snap.data() as Record<string, unknown>
        setFullName(asString(data.fullName).trim() || 'Unknown')
        setGhanaCardId(asString(data.ghanaCardId))
        setPhone(asString(data.phone))
        setPostpartumDuration(asString(data.postpartumDuration))
        setHeightCm(asString(data.heightCm))
        setLinkedFacilityName(asString(data.linkedFacilityName))
        setLinkedFacilityId(asString(data.linkedFacilityId))
        setNhis(
          asString(data.NhisId) ||
            asString(data.nhisNumber) ||
            asString(data.nhis) ||
            asString(data.NHIS) ||
            '',
        )
        setHomeAddress(asString(data.homeAddress).trim())
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Unable to load patient.')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [motherUid])

  const initials = initialsFromDisplayName(fullName)
  /** First line: phone, ID, postpartum — keeps action buttons from being squeezed. */
  const metaLinePrimary = [phone, ghanaCardId, postpartumDuration].filter(Boolean)
  const metaLineSecondary = [
    heightCm && `Height: ${heightCm}`,
    linkedFacilityName,
  ].filter(Boolean)

  const canReferPatient =
    !!staffUid &&
    !!facilityId &&
    !!motherUid &&
    !!linkedFacilityId &&
    facilityId === linkedFacilityId

  const referChoices = facilityOptions.filter((f) => f.id !== linkedFacilityId)

  if (!motherUid) {
    return (
      <TsaLayout navContext="patientDetail" onNavigate={onNavigate}>
        <main className="tsa-main tsa-main--patient-detail max-w-2xl mx-auto px-6 py-10">
          <p className="text-sm text-slate-600 mb-4">
            Open a patient from the Live Feed, Alert history, or Red-flag Alerts (Manage Case).
          </p>
          <button
            type="button"
            className="tsa-secondary-button"
            onClick={() => onNavigate(backPage === 'patientDetail' ? 'live' : backPage)}
          >
            {backPage === 'escalations'
              ? 'Back to Red-flag Alerts'
              : backPage === 'alertHistory'
                ? 'Back to Alert history'
                : 'Back to Live Feed'}
          </button>
        </main>
      </TsaLayout>
    )
  }

  const mentalHealthMain =
    latestPpdWithScore?.totalScore != null
      ? String(latestPpdWithScore.totalScore)
      : '—'
  const mentalHealthCaption =
    latestPpdWithScore != null
      ? `Latest EPDS · ${latestPpdWithScore.riskLevel || '—'}${latestPpdWithScore.conductedAt ? ` · ${formatWhen(latestPpdWithScore.conductedAt)}` : ''}`
      : 'No PPD / EPDS submissions yet'

  const latestSevereCheckIn = checkIns.find((c) => c.severity.toLowerCase() === 'severe')
  const latestMeal = mealLogs[0] ?? null
  const nutritionMain = String(mealLogs.length)
  const nutritionCaption =
    latestMeal != null
      ? `Meal logs recorded · latest ${formatWhen(latestMeal.loggedAt)}`
      : 'No meal logs yet'

  return (
    <TsaLayout navContext="patientDetail" onNavigate={onNavigate}>
      <main className="tsa-main tsa-main--patient-detail">
        <section className="tsa-patient-detail-left">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="tsa-link-button text-sm text-slate-600"
              onClick={() => onNavigate(backPage === 'patientDetail' ? 'live' : backPage)}
            >
              ←{' '}
              {backPage === 'escalations'
                ? 'Red-flag Alerts'
                : backPage === 'alertHistory'
                  ? 'Alert history'
                  : 'Live Feed'}
            </button>
            <button
              type="button"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline"
              onClick={() => onNavigate('patientRecord')}
            >
              Full track record &amp; PDF
            </button>
          </div>
          <header className="tsa-patient-detail-header">
            <div className="tsa-patient-detail-identity">
              <div className="tsa-patient-avatar-circle">{loading ? '…' : initials}</div>
              <div className="tsa-patient-detail-text">
                <div className="tsa-patient-detail-name">
                  {loading ? 'Loading…' : fullName}
                </div>
                {error ? (
                  <div className="tsa-patient-detail-meta">{error}</div>
                ) : loading ? (
                  <div className="tsa-patient-detail-meta">…</div>
                ) : (
                  <>
                    <div className="tsa-patient-detail-meta">
                      {metaLinePrimary.length ? metaLinePrimary.join(' · ') : '—'}
                    </div>
                    {metaLineSecondary.length ? (
                      <div className="tsa-patient-detail-meta">
                        {metaLineSecondary.join(' · ')}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </header>

          {canReferPatient ? (
            <section className="tsa-card tsa-patient-timeline-card mb-4">
              <header className="tsa-patient-timeline-header px-4 pt-4">
                <div>
                  <div className="tsa-detail-section-title">Refer to another facility</div>
                  <div className="tsa-patient-timeline-subtitle">
                    Changes her <span className="font-medium">linked hospital</span> and moves{' '}
                    <span className="font-medium">active</span> red-flag alerts to the receiving site
                    for triage.
                  </div>
                </div>
              </header>
              <div className="px-4 pb-4 space-y-3">
                {facilitiesError ? (
                  <p className="text-xs text-rose-600">{facilitiesError}</p>
                ) : null}
                {referErr ? <p className="text-xs text-rose-600">{referErr}</p> : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                  <label htmlFor="refer-facility" className="sr-only">
                    Destination facility
                  </label>
                  <select
                    id="refer-facility"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 min-w-[14rem] max-w-full focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    disabled={facilitiesLoading || referBusy}
                    value={referTargetId}
                    onChange={(e) => {
                      setReferTargetId(e.target.value)
                      setReferErr(null)
                    }}
                  >
                    <option value="">
                      {facilitiesLoading ? 'Loading facilities…' : 'Select receiving hospital…'}
                    </option>
                    {referChoices.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                        {f.region ? ` · ${f.region}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="tsa-secondary-button text-sm shrink-0"
                    disabled={
                      referBusy ||
                      !referTargetId ||
                      !motherUid ||
                      !facilityId ||
                      referTargetId === linkedFacilityId
                    }
                    onClick={async () => {
                      if (!motherUid || !staffUid || !facilityId || !referTargetId) return
                      const dest = facilityOptions.find((f) => f.id === referTargetId)
                      if (!dest) {
                        setReferErr('Invalid facility.')
                        return
                      }
                      if (
                        !window.confirm(
                          `Refer this patient to ${dest.name}? She will appear under that facility’s caseload; active alerts will show there as new.`,
                        )
                      ) {
                        return
                      }
                      setReferBusy(true)
                      setReferErr(null)
                      try {
                        await referPatientToFacility({
                          patientId: motherUid,
                          staffUid,
                          previousFacilityId: linkedFacilityId || facilityId,
                          previousFacilityName:
                            linkedFacilityName || staffFacilityName || linkedFacilityId || facilityId,
                          newFacilityId: dest.id,
                          newFacilityName: dest.name,
                        })
                        setReferTargetId('')
                      } catch (e: unknown) {
                        setReferErr(e instanceof Error ? e.message : 'Referral failed.')
                      } finally {
                        setReferBusy(false)
                      }
                    }}
                  >
                    {referBusy ? 'Referring…' : 'Confirm referral'}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <section className="tsa-card tsa-patient-timeline-card mb-4">
            <header className="tsa-patient-timeline-header px-4 pt-4">
              <div>
                <div className="tsa-detail-section-title">Facility transfers &amp; handoff log</div>
                <div className="tsa-patient-timeline-subtitle">
                  Log of hospital-to-hospital moves and handoff snapshots. Day-to-day clinical data
                  appears in the sections below.
                </div>
              </div>
            </header>
            {referralsError ? (
              <p className="text-xs text-rose-600 px-4 pb-4">{referralsError}</p>
            ) : referralsLoading ? (
              <p className="text-sm text-slate-500 px-4 pb-4">Loading…</p>
            ) : referralHistory.length === 0 ? (
              <p className="text-xs text-slate-500 px-4 pb-4">
                No facility transfers logged yet. When a referral is completed, a row appears here
                with the handoff summary.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 px-4 pb-4">
                {referralHistory.map((r) => (
                  <li key={r.id} className="py-3 text-sm">
                    <div className="font-medium text-slate-800">
                      {formatWhen(r.referredAt)}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      <span className="text-slate-500">From:</span> {r.previousFacilityName}
                      <span className="mx-1.5 text-slate-400">→</span>
                      <span className="text-slate-500">To:</span> {r.newFacilityName}
                    </div>
                    {r.clinicalHandoffSummary ? (
                      <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap bg-slate-50 rounded-md px-2 py-1.5">
                        {r.clinicalHandoffSummary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="tsa-patient-detail-metrics">
            <article className="tsa-patient-metric-card">
              <div className="tsa-metric-label">Mental Health (EPDS)</div>
              <div className="tsa-patient-metric-main">
                <span className="tsa-patient-metric-value">{mentalHealthMain}</span>
              </div>
              <div className="tsa-metric-caption">{mentalHealthCaption}</div>
            </article>
            <article className="tsa-patient-metric-card">
              <div className="tsa-metric-label">Postnatal period</div>
              <div className="tsa-patient-metric-main">
                <span className="tsa-patient-metric-value">
                  {postpartumDuration || '—'}
                </span>
              </div>
            </article>
            <article className="tsa-patient-metric-card">
              <div className="tsa-metric-label">Nutritional adherence</div>
              <div className="tsa-patient-metric-main">
                <span className="tsa-patient-metric-value">{nutritionMain}</span>
              </div>
              <div className="tsa-metric-caption">{nutritionCaption}</div>
            </article>
          </section>

          {clinicalError ? (
            <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2 mb-3">
              Clinical data: {clinicalError}
            </p>
          ) : null}

          <section className="tsa-card tsa-patient-timeline-card mb-4">
            <header className="tsa-patient-timeline-header px-4 pt-4">
              <div>
                <div className="tsa-detail-section-title">Facility alerts — recent</div>
                <div className="tsa-patient-timeline-subtitle">
                  Latest incidents at your facility (casework). Trimmed to recent items.
                </div>
              </div>
            </header>
            {facilityAlertsLoading ? (
              <p className="text-sm text-slate-500 px-4 pb-4">Loading alerts…</p>
            ) : patientAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 px-4 pb-4">No alerts for this patient yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 px-4 pb-3">
                {patientAlerts.slice(0, 5).map((a) => (
                  <li key={a.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {formatWhen(a.createdAt)}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {alertStatusLabel(a.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{a.summary || '—'}</p>
                    {staffUid ? (
                      <div className="mt-2">
                        <AlertStaffActionButtons alert={a} staffUid={staffUid} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="tsa-card tsa-patient-timeline-card mb-4">
            <header className="tsa-patient-timeline-header px-4 pt-4">
              <div>
                <div className="tsa-detail-section-title">Symptoms &amp; check-ins — recent</div>
                <div className="tsa-patient-timeline-subtitle">
                  Latest reports from the app. Trimmed to recent check-ins.
                </div>
              </div>
            </header>
            {clinicalLoading ? (
              <p className="text-sm text-slate-500 px-4 pb-4">Loading…</p>
            ) : checkIns.length === 0 ? (
              <p className="text-xs text-slate-500 px-4 pb-4">No check-ins recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 px-4 pb-2">
                {checkIns.slice(0, 4).map((c) => (
                  <li key={c.id} className="py-3 text-sm">
                    <div className="font-medium text-slate-800 flex flex-wrap gap-2 items-center">
                      <span>{formatWhen(c.loggedAt)}</span>
                      <span
                        className={
                          c.severity.toLowerCase() === 'severe'
                            ? 'text-[11px] font-semibold uppercase tracking-wide text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full'
                            : 'text-[11px] font-semibold uppercase tracking-wide text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full'
                        }
                      >
                        {c.severity}
                      </span>
                    </div>
                    {c.symptoms.length ? (
                      <ul className="mt-1.5 list-disc list-inside text-slate-700 text-xs space-y-0.5">
                        {c.symptoms.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">No symptom list on this entry.</p>
                    )}
                    {c.notes ? (
                      <p className="text-xs text-slate-600 mt-1.5 italic">Notes: {c.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {latestSevereCheckIn != null && latestSevereCheckIn.symptoms.length ? (
            <section className="tsa-card tsa-detail-card tsa-detail-card--symptoms mb-4 mx-0">
              <div className="tsa-detail-section-heading px-4 pt-4">Severe check-in (highlight)</div>
              <div className="px-4 pb-4 space-y-2">
                {latestSevereCheckIn.symptoms.map((label) => (
                  <div key={label} className="tsa-symptom-bar">
                    <div className="tsa-symptom-label-row">
                      <span>{label}</span>
                      <span className="tsa-symptom-value tsa-symptom-value--severe">Reported</span>
                    </div>
                    <div className="tsa-symptom-track">
                      <div className="tsa-symptom-fill tsa-symptom-fill--bleeding" style={{ width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="tsa-card tsa-patient-timeline-card mb-4">
            <header className="tsa-patient-timeline-header px-4 pt-4 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="tsa-detail-section-title">PPD / EPDS — recent</div>
                <div className="tsa-patient-timeline-subtitle">
                  Latest EPDS submissions. Trimmed to recent screenings.
                </div>
              </div>
              {!clinicalLoading && ppdScreenings.length > 0 ? (
                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                  onClick={() => onNavigate('patientEpds')}
                >
                  View full questionnaire responses
                </button>
              ) : null}
            </header>
            {clinicalLoading ? (
              <p className="text-sm text-slate-500 px-4 pb-4">Loading…</p>
            ) : ppdScreenings.length === 0 ? (
              <p className="text-xs text-slate-500 px-4 pb-4">No screenings yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 px-4 pb-2">
                {ppdScreenings.slice(0, 3).map((p) => (
                  <li key={p.id} className="py-3 text-sm">
                    <div className="font-medium text-slate-800">{formatWhen(p.conductedAt)}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Score: {p.totalScore != null ? p.totalScore : 'pending'} · Risk: {p.riskLevel}
                      {p.language ? ` · Lang: ${p.language}` : ''}
                    </div>
                    {p.textSummary ? (
                      <p className="text-xs text-slate-700 mt-1.5 line-clamp-4">{p.textSummary}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="tsa-card tsa-patient-timeline-card mb-4">
            <header className="tsa-patient-timeline-header px-4 pt-4">
              <div>
                <div className="tsa-detail-section-title">Meal logs — recent</div>
                <div className="tsa-patient-timeline-subtitle">
                  Latest Smart Plate submissions with key nutrients.
                </div>
              </div>
            </header>
            {clinicalLoading ? (
              <p className="text-sm text-slate-500 px-4 pb-4">Loading…</p>
            ) : mealLogs.length === 0 ? (
              <p className="text-xs text-slate-500 px-4 pb-4">No meals logged yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 px-4 pb-2">
                {mealLogs.slice(0, 4).map((m) => (
                  <li key={m.id} className="py-3 text-sm">
                    <div className="font-medium text-slate-800">{formatWhen(m.loggedAt)}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Protein: {m.proteinGrams != null ? `${m.proteinGrams.toFixed(1)}g` : '—'} ·
                      Iron: {m.ironMg != null ? `${m.ironMg.toFixed(1)}mg` : '—'} · Folate:{' '}
                      {m.folateMcg != null ? `${m.folateMcg.toFixed(1)}mcg` : '—'}
                    </div>
                    {m.ingredients.length ? (
                      <p className="text-xs text-slate-700 mt-1.5">
                        Ingredients: {m.ingredients.slice(0, 6).map((x) => x.name).join(', ')}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="tsa-card tsa-patient-timeline-card mb-4">
            <header className="tsa-patient-timeline-header px-4 pt-4">
              <div>
                <div className="tsa-detail-section-title">Mood log — recent</div>
                <div className="tsa-patient-timeline-subtitle">
                  Latest mood entries from the app. Trimmed list.
                </div>
              </div>
            </header>
            {clinicalLoading ? (
              <p className="text-sm text-slate-500 px-4 pb-4">Loading…</p>
            ) : moodLogs.length === 0 ? (
              <p className="text-xs text-slate-500 px-4 pb-4">No mood logs yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2 px-4 pb-4">
                {moodLogs.slice(0, 8).map((m) => (
                  <li
                    key={m.id}
                    className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full"
                  >
                    {formatWhen(m.date)} · {m.mood}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="tsa-card tsa-patient-timeline-card mb-4">
            <header className="tsa-patient-timeline-header px-4 pt-4">
              <div>
                <div className="tsa-detail-section-title">Health progress timeline — recent</div>
                <div className="tsa-patient-timeline-subtitle">
                  Newest check-ins, screenings, meals, and mood combined. Trimmed to recent events.
                </div>
              </div>
            </header>
            {clinicalLoading ? (
              <p className="text-sm text-slate-500 px-4 pb-4">Loading…</p>
            ) : timeline.length === 0 ? (
              <p className="text-xs text-slate-500 px-4 pb-4">No clinical events yet.</p>
            ) : (
              <ol className="border-l border-slate-200 ml-4 mr-4 mb-4 space-y-3">
                {timeline.slice(0, 12).map((t) => (
                  <li key={t.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
                    <div className="text-[11px] text-slate-500">{formatWhen(t.at)}</div>
                    <div className="text-sm font-medium text-slate-800">{t.title}</div>
                    {t.detail ? <div className="text-xs text-slate-600 mt-0.5">{t.detail}</div> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="tsa-card tsa-patient-notes-card">
            <header className="tsa-patient-notes-header">
              <div className="tsa-patient-notes-title-row">
                <span className="tsa-detail-section-title">Clinical Assessment &amp; Follow-up</span>
              </div>
              <div className="tsa-patient-notes-meta">
                {notesLoading ? 'Loading…' : `${clinicalNotes.length} note(s)`}
              </div>
            </header>
            <p className="text-[11px] text-slate-500 px-4 -mt-1 mb-2 leading-relaxed">
              Staff only — not shown to mothers in the app. Recent notes below; add follow-up here.
            </p>
            {notesError ? (
              <p className="text-xs text-rose-600 px-4 mb-2">{notesError}</p>
            ) : null}
            {addError ? (
              <p className="text-xs text-rose-600 px-4 mb-2">{addError}</p>
            ) : null}
            <div className="tsa-patient-notes-body">
              <textarea
                className="tsa-patient-notes-textarea"
                placeholder="Add a staff clinical note for this patient…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                disabled={!staffUid || !facilityId}
                rows={4}
              />
            </div>
            <div className="tsa-patient-notes-footer flex flex-col gap-3 items-stretch sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="tsa-primary-button tsa-primary-button--notes"
                disabled={!staffUid || !facilityId || savingNote || !noteDraft.trim()}
                onClick={async () => {
                  if (!staffUid) return
                  setSavingNote(true)
                  try {
                    await addNote(
                      noteDraft,
                      staffDisplayName,
                      staffUid,
                      staffFacilityName || linkedFacilityName || undefined,
                    )
                    setNoteDraft('')
                  } catch {
                    /* addError set in hook */
                  } finally {
                    setSavingNote(false)
                  }
                }}
              >
                {savingNote ? 'Saving…' : 'Save note'}
              </button>
            </div>
            {clinicalNotes.length > 0 ? (
              <ul className="border-t border-slate-100 mt-3 pt-3 px-4 pb-4 space-y-3 max-h-64 overflow-y-auto">
                {clinicalNotes.slice(0, 5).map((n) => {
                  const atFacility =
                    n.facilityName ||
                    (n.facilityId && facilityId && n.facilityId === facilityId
                      ? 'This facility'
                      : n.facilityId || '—')
                  return (
                    <li key={n.id} className="text-sm">
                      <div className="text-[11px] text-slate-500">
                        {formatWhen(n.createdAt)} · {n.authorDisplayName}
                        {atFacility ? (
                          <span className="text-slate-400"> · {atFacility}</span>
                        ) : null}
                      </div>
                      <p className="text-slate-800 mt-1 whitespace-pre-wrap">{n.content}</p>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </section>
        </section>

        <aside className="tsa-patient-detail-right">
          <section className="tsa-card tsa-identity-card">
            <header className="tsa-identity-header">
              <span className="tsa-detail-section-title">Identity Verification</span>
            </header>
            <div className="tsa-identity-row">
              <div className="tsa-identity-label">Ghana Card ID</div>
              <div className="tsa-identity-value">{ghanaCardId || '—'}</div>
            </div>
            <div className="tsa-identity-row">
              <div className="tsa-identity-label">NHIS Number</div>
              <div className="tsa-identity-value">{nhis || '—'}</div>
            </div>
          </section>

          <section className="tsa-card tsa-emergency-card">
            <header className="tsa-emergency-header">
              <span className="tsa-detail-section-title">Contact</span>
            </header>
            <div className="tsa-emergency-body">
              <div className="tsa-emergency-name">{fullName || 'Patient'}</div>
              <div className="tsa-emergency-phone">{phone || '—'}</div>
              {homeAddress ? (
                <div className="tsa-emergency-address whitespace-pre-wrap">
                  <span className="tsa-emergency-address-label">Address: </span>
                  {homeAddress}
                </div>
              ) : (
                <div className="tsa-emergency-address-empty">No address on file (optional)</div>
              )}
            </div>
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="tsa-primary-button tsa-primary-button--quickcall inline-block text-center no-underline"
              >
                Initiate Quick-Call
              </a>
            ) : (
              <button
                type="button"
                className="tsa-primary-button tsa-primary-button--quickcall"
                disabled
              >
                Initiate Quick-Call
              </button>
            )}
          </section>
        </aside>
      </main>
    </TsaLayout>
  )
}
