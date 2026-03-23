import React, { useEffect, useState } from 'react'
import './dashboard.css'
import type { TsaPage } from './App'
import { TsaLayout } from './TsaLayout'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { usePatientClinicalData, type PpdAnswerRow, type PpdScreeningRow } from './usePatientClinicalData'

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

function languageLabel(code: string): string {
  const c = code.trim().toLowerCase()
  const map: Record<string, string> = {
    en: 'English',
    ga: 'Ga',
    tw: 'Twi',
  }
  return map[c] || (code ? code : '—')
}

function AnswerBlock({ index, a }: { index: number; a: PpdAnswerRow }) {
  const label = a.id ? `Q ${a.id}` : `Question ${index + 1}`
  const hasChoice = a.selectedLabel.trim().length > 0
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm">
      <div className="font-medium text-slate-800">{label}</div>
      {a.questionText ? (
        <p className="mt-1.5 text-slate-700 leading-relaxed">{a.questionText}</p>
      ) : null}
      <div className="mt-2 rounded-md bg-white border border-slate-200 px-3 py-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
          Answer selected
        </div>
        {hasChoice ? (
          <>
            <p className="text-slate-900 font-medium leading-relaxed">{a.selectedLabel}</p>
            {a.score != null ? (
              <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
                EPDS points for this item: {a.score}
              </p>
            ) : null}
          </>
        ) : a.score != null ? (
          <p className="text-slate-700">
            EPDS item score only: <span className="font-semibold tabular-nums">{a.score}</span>
            <span className="block text-xs font-normal text-slate-500 mt-1">
              Option wording was not stored (older app). 0–3 = points for this question on the
              scale.
            </span>
          </p>
        ) : (
          <p className="text-slate-500">No selection recorded.</p>
        )}
      </div>
      {a.answerText ? (
        <p className="mt-2 text-xs text-slate-600 italic border-l-2 border-slate-300 pl-2">
          Notes: {a.answerText}
        </p>
      ) : null}
      {a.audioUrl ? (
        <div className="mt-3">
          <div className="text-xs font-medium text-slate-600 mb-1">Voice note</div>
          <audio
            className="w-full max-w-md h-9"
            controls
            preload="metadata"
            src={a.audioUrl}
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      ) : null}
    </div>
  )
}

function ScreeningCard({ p }: { p: PpdScreeningRow }) {
  const hasAnswers = p.answers.length > 0
  const hasLegacyAudio = !!p.screeningAudioUrl
  const summaryLine = [
    formatWhen(p.conductedAt),
    p.totalScore != null ? `Score ${p.totalScore}` : 'Score pending',
    `Risk: ${p.riskLevel}`,
  ].join(' · ')

  return (
    <details className="tsa-card rounded-xl border border-slate-200 bg-white shadow-sm mb-3 group">
      <summary className="cursor-pointer list-none px-4 py-3 flex flex-wrap items-center justify-between gap-2 marker:content-none [&::-webkit-details-marker]:hidden">
        <div>
          <div className="font-medium text-slate-900">{summaryLine}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Language: {languageLabel(p.language)}
            {!hasAnswers && !hasLegacyAudio ? ' · No per-question data (legacy or pending)' : null}
          </div>
        </div>
        <span className="text-xs text-blue-600 group-open:hidden shrink-0">Show responses</span>
        <span className="text-xs text-blue-600 hidden group-open:inline shrink-0">Hide</span>
      </summary>
      <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4">
        {p.textSummary ? (
          <div className="pt-3">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Overall notes / summary
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{p.textSummary}</p>
          </div>
        ) : null}

        {hasLegacyAudio ? (
          <div>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Screening audio (voice check-in)
            </div>
            <audio
              className="w-full max-w-md h-9"
              controls
              preload="metadata"
              src={p.screeningAudioUrl!}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        ) : null}

        {hasAnswers ? (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Questionnaire responses
            </div>
            {p.answers.map((a, i) => (
              <AnswerBlock key={`${p.id}-${a.id || i}`} index={i} a={a} />
            ))}
          </div>
        ) : !p.textSummary && !hasLegacyAudio ? (
          <p className="text-sm text-slate-500 pt-2">No stored answers or audio for this entry.</p>
        ) : null}
      </div>
    </details>
  )
}

export const PatientEpdsResponsesPage: React.FC<{
  motherUid: string | null
  onNavigate: (page: TsaPage) => void
}> = ({ motherUid, onNavigate }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')

  const { ppdScreenings, loading: clinicalLoading, error: clinicalError } =
    usePatientClinicalData(motherUid)

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
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Unable to load patient.')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [motherUid])

  if (!motherUid) {
    return (
      <TsaLayout navContext="patientEpds" onNavigate={onNavigate}>
        <main className="tsa-main max-w-2xl mx-auto px-6 py-10">
          <p className="text-sm text-slate-600 mb-4">No patient selected.</p>
          <button type="button" className="tsa-secondary-button" onClick={() => onNavigate('live')}>
            Back to Live Feed
          </button>
        </main>
      </TsaLayout>
    )
  }

  const pageBusy = loading || clinicalLoading

  return (
    <TsaLayout navContext="patientEpds" onNavigate={onNavigate}>
      <main className="tsa-main max-w-3xl mx-auto px-6 py-8 pb-16">
        <header className="mb-6 pb-6 border-b border-slate-200">
          <button
            type="button"
            className="tsa-link-button text-sm text-slate-600 text-left mb-4 inline-flex items-center gap-1"
            onClick={() => onNavigate('patientDetail')}
          >
            ← Back to patient details
          </button>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">EPDS questionnaire</h1>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{fullName || 'Patient'}</span> — full
            submissions with scores, free-text notes, and any voice recordings sent from the app.
          </p>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </header>

        {clinicalError ? (
          <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2 mb-4">{clinicalError}</p>
        ) : null}

        {pageBusy ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : ppdScreenings.length === 0 ? (
          <p className="text-sm text-slate-600">No PPD / EPDS submissions yet for this patient.</p>
        ) : (
          <div>
            <p className="text-xs text-slate-500 mb-3">
              Newest first. Expand a row to see each question, notes, and audio.
            </p>
            {ppdScreenings.map((p) => (
              <ScreeningCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>
    </TsaLayout>
  )
}
