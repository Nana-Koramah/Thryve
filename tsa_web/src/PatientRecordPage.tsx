import React, { useEffect, useMemo, useState } from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { TsaLayout } from './TsaLayout'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { useStaffWelcome } from './useStaffWelcome'
import { usePatientClinicalData } from './usePatientClinicalData'
import { useAlertsAtFacility, alertStatusLabel } from './useAlertsAtFacility'
import { useClinicalNotes } from './useClinicalNotes'
import { usePatientReferrals } from './usePatientReferrals'
import { downloadPatientClinicalTrackPdf } from './patientTrackRecordPdf'

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

export const PatientRecordPage: React.FC<{
  motherUid: string | null
  onNavigate: (page: TsaPage) => void
}> = ({ motherUid, onNavigate }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [ghanaCardId, setGhanaCardId] = useState('')
  const [phone, setPhone] = useState('')
  const [postpartumDuration, setPostpartumDuration] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [linkedFacilityName, setLinkedFacilityName] = useState('')
  const [nhis, setNhis] = useState('')
  const [homeAddress, setHomeAddress] = useState('')

  const { facilityId, facilityName: staffFacilityName } = useStaffWelcome()
  const {
    rows: referralHistory,
    loading: referralsLoading,
    error: referralsError,
  } = usePatientReferrals(motherUid)
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
  } = useClinicalNotes(motherUid, facilityId || null)

  const {
    checkIns,
    ppdScreenings,
    moodLogs,
    mealLogs,
    timeline,
    loading: clinicalLoading,
    error: clinicalError,
  } = usePatientClinicalData(motherUid)

  useEffect(() => {
    if (!motherUid) {
      setLoading(false)
      setError(null)
      setFullName('')
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

  const demographics = useMemo(
    () => ({
      Phone: phone,
      'Ghana Card': ghanaCardId,
      NHIS: nhis,
      'Postpartum period': postpartumDuration,
      Height: heightCm ? `${heightCm} cm` : '',
      'Linked facility': linkedFacilityName,
      Address: homeAddress,
    }),
    [phone, ghanaCardId, nhis, postpartumDuration, heightCm, linkedFacilityName, homeAddress],
  )

  const runPdf = () => {
    downloadPatientClinicalTrackPdf({
      patientName: fullName || 'Patient',
      staffFacilityLabel: staffFacilityName || facilityId || '—',
      generatedAt: new Date(),
      demographics,
      checkIns: checkIns.map((c) => ({
        loggedAt: c.loggedAt,
        severity: c.severity,
        symptoms: c.symptoms,
        notes: c.notes,
      })),
      ppdScreenings: ppdScreenings.map((p) => ({
        conductedAt: p.conductedAt,
        totalScore: p.totalScore,
        riskLevel: p.riskLevel,
        textSummary: p.textSummary,
      })),
      mealLogs: mealLogs.map((m) => ({
        loggedAt: m.loggedAt,
        ingredients: m.ingredients.map((i) => i.name),
        carbsGrams: m.carbsGrams,
        proteinGrams: m.proteinGrams,
        ironMg: m.ironMg,
        folateMcg: m.folateMcg,
      })),
      moodLogs: moodLogs.map((m) => ({ date: m.date, mood: m.mood })),
      timeline: timeline.map((t) => ({ at: t.at, title: t.title, detail: t.detail })),
      alerts: patientAlerts.map((a) => ({
        createdAt: a.createdAt,
        status: alertStatusLabel(a.status),
        summary: a.summary || '',
      })),
      referrals: referralHistory.map((r) => ({
        referredAt: r.referredAt,
        previousFacilityName: r.previousFacilityName,
        newFacilityName: r.newFacilityName,
        clinicalHandoffSummary: r.clinicalHandoffSummary,
      })),
      clinicalNotes: clinicalNotes.map((n) => ({
        createdAt: n.createdAt,
        authorDisplayName: n.authorDisplayName,
        facilityLabel: n.facilityName || n.facilityId || '—',
        content: n.content,
      })),
    })
  }

  if (!motherUid) {
    return (
      <TsaLayout navContext="patientRecord" onNavigate={onNavigate}>
        <main className="tsa-main max-w-2xl mx-auto px-6 py-10">
          <p className="text-sm text-slate-600 mb-4">No patient selected.</p>
          <button type="button" className="tsa-secondary-button" onClick={() => onNavigate('live')}>
            Back to Live Feed
          </button>
        </main>
      </TsaLayout>
    )
  }

  const pageBusy = loading || clinicalLoading || facilityAlertsLoading || referralsLoading || notesLoading

  return (
    <TsaLayout navContext="patientRecord" onNavigate={onNavigate}>
      <main className="tsa-main tsa-main--patient-record">
        <header className="w-full min-w-0 mb-6 pb-6 border-b border-slate-200">
          <button
            type="button"
            className="tsa-link-button text-sm text-slate-600 text-left mb-4"
            onClick={() => onNavigate('patientDetail')}
          >
            ← Back to case summary
          </button>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Full clinical track record
          </h1>
          <p className="mt-3 w-full text-sm text-slate-600 leading-relaxed text-pretty">
            <span className="font-medium text-slate-800">{fullName || 'Patient'}</span> — complete
            app-submitted history, alerts at your facility, transfers, and staff notes. Use this page
            or export a PDF for audits and handoffs.
          </p>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          <button
            type="button"
            className="tsa-primary-button text-sm mt-5 w-fit"
            disabled={pageBusy || !!error}
            onClick={() => runPdf()}
          >
            Download PDF
          </button>
        </header>

        {clinicalError ? (
          <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2 mb-4">{clinicalError}</p>
        ) : null}
        {notesError ? (
          <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2 mb-4">{notesError}</p>
        ) : null}
        {referralsError ? (
          <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2 mb-4">{referralsError}</p>
        ) : null}

        <section className="tsa-card tsa-patient-timeline-card mb-4">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">Demographics</div>
          </header>
          <dl className="px-4 pb-4 text-sm grid gap-2">
            {Object.entries(demographics).map(([k, v]) =>
              v ? (
                <div key={k} className="grid grid-cols-[8rem_1fr] gap-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-800">{v}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </section>

        <section className="tsa-card tsa-patient-timeline-card mb-4">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">Facility alerts (all)</div>
          </header>
          <div className="px-4 pb-4">
            {facilityAlertsLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : patientAlerts.length === 0 ? (
              <p className="text-xs text-slate-500">None.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patientAlerts.map((a) => (
                  <li key={a.id} className="py-3 text-sm">
                    <div className="font-medium text-slate-800">{formatWhen(a.createdAt)}</div>
                    <div className="text-xs text-slate-600">{alertStatusLabel(a.status)}</div>
                    <p className="text-xs text-slate-600 mt-1">{a.summary || '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="tsa-card tsa-patient-timeline-card mb-4">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">Check-ins (all)</div>
          </header>
          <div className="px-4 pb-4">
            {clinicalLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : checkIns.length === 0 ? (
              <p className="text-xs text-slate-500">None.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {checkIns.map((c) => (
                  <li key={c.id} className="py-3 text-sm">
                    <div className="font-medium">
                      {formatWhen(c.loggedAt)} · {c.severity}
                    </div>
                    {c.symptoms.length ? (
                      <ul className="mt-1 list-disc list-inside text-xs text-slate-700">
                        {c.symptoms.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    ) : null}
                    {c.notes ? <p className="text-xs text-slate-600 mt-1">Notes: {c.notes}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="tsa-card tsa-patient-timeline-card mb-4">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">PPD / EPDS (all)</div>
          </header>
          <div className="px-4 pb-4">
            {clinicalLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : ppdScreenings.length === 0 ? (
              <p className="text-xs text-slate-500">None.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {ppdScreenings.map((p) => (
                  <li key={p.id} className="py-3 text-sm">
                    <div className="font-medium">{formatWhen(p.conductedAt)}</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Score: {p.totalScore ?? 'pending'} · {p.riskLevel}
                    </p>
                    {p.textSummary ? (
                      <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{p.textSummary}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="tsa-card tsa-patient-timeline-card mb-4">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">Meal logs (all)</div>
          </header>
          <div className="px-4 pb-4">
            {clinicalLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : mealLogs.length === 0 ? (
              <p className="text-xs text-slate-500">None.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {mealLogs.map((m) => (
                  <li key={m.id} className="py-3 text-sm">
                    <div className="font-medium">{formatWhen(m.loggedAt)}</div>
                    <p className="text-xs text-slate-600 mt-1">
                      Protein: {m.proteinGrams != null ? `${m.proteinGrams.toFixed(1)}g` : '—'} ·
                      Iron: {m.ironMg != null ? `${m.ironMg.toFixed(1)}mg` : '—'} · Folate:{' '}
                      {m.folateMcg != null ? `${m.folateMcg.toFixed(1)}mcg` : '—'}
                    </p>
                    {m.ingredients.length ? (
                      <p className="text-xs text-slate-700 mt-1">
                        Ingredients: {m.ingredients.map((i) => i.name).join(', ')}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="tsa-card tsa-patient-timeline-card mb-4">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">Mood log (all)</div>
          </header>
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {clinicalLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : moodLogs.length === 0 ? (
              <p className="text-xs text-slate-500">None.</p>
            ) : (
              moodLogs.map((m) => (
                <span
                  key={m.id}
                  className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full"
                >
                  {formatWhen(m.date)} · {m.mood}
                </span>
              ))
            )}
          </div>
        </section>

        <section className="tsa-card tsa-patient-timeline-card mb-4">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">Combined timeline</div>
          </header>
          <div className="px-4 pb-4">
            {clinicalLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : timeline.length === 0 ? (
              <p className="text-xs text-slate-500">None.</p>
            ) : (
              <ol className="border-l border-slate-200 ml-2 space-y-3">
                {timeline.map((t) => (
                  <li key={t.id} className="pl-4">
                    <div className="text-[11px] text-slate-500">{formatWhen(t.at)}</div>
                    <div className="text-sm font-medium text-slate-800">{t.title}</div>
                    {t.detail ? (
                      <div className="text-xs text-slate-600 mt-0.5">{t.detail}</div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className="tsa-card tsa-patient-timeline-card mb-4">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">Facility transfers &amp; handoff</div>
          </header>
          <div className="px-4 pb-4">
            {referralsLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : referralHistory.length === 0 ? (
              <p className="text-xs text-slate-500">None logged.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {referralHistory.map((r) => (
                  <li key={r.id} className="py-3 text-sm">
                    <div className="font-medium">{formatWhen(r.referredAt)}</div>
                    <p className="text-xs text-slate-600 mt-1">
                      {r.previousFacilityName} → {r.newFacilityName}
                    </p>
                    {r.clinicalHandoffSummary ? (
                      <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap bg-slate-50 rounded-md px-2 py-1.5">
                        {r.clinicalHandoffSummary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="tsa-card tsa-patient-timeline-card mb-8">
          <header className="tsa-patient-timeline-header px-4 pt-4">
            <div className="tsa-detail-section-title">Staff clinical notes (all)</div>
          </header>
          <div className="px-4 pb-4">
            {notesLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : clinicalNotes.length === 0 ? (
              <p className="text-xs text-slate-500">None.</p>
            ) : (
              <ul className="space-y-3">
                {clinicalNotes.map((n) => (
                  <li key={n.id} className="text-sm border-b border-slate-100 pb-3 last:border-0">
                    <div className="text-[11px] text-slate-500">
                      {formatWhen(n.createdAt)} · {n.authorDisplayName} ·{' '}
                      {n.facilityName || n.facilityId || '—'}
                    </div>
                    <p className="text-slate-800 mt-1 whitespace-pre-wrap">{n.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </TsaLayout>
  )
}
