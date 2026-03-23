import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  limit,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { formatSymptomIds } from './clinicalLabels'

function timestampToDate(v: unknown): Date | null {
  if (v == null) return null
  if (typeof v === 'object' && v !== null && 'toDate' in v) {
    const d = (v as { toDate: () => Date }).toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
  }
  return null
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export type CheckInRow = {
  id: string
  loggedAt: Date | null
  symptoms: string[]
  severity: string
  notes: string
}

export type PpdAnswerRow = {
  id: string
  questionText: string
  score: number | null
  /** Wording of the EPDS option the patient chose (from app). */
  selectedLabel: string
  answerText: string
  audioUrl: string
}

export type PpdScreeningRow = {
  id: string
  conductedAt: Date | null
  totalScore: number | null
  riskLevel: string
  textSummary: string
  language: string
  /** Per-question EPDS payload from the app (order preserved). */
  answers: PpdAnswerRow[]
  /** Legacy single recording from voice-only PPD flow (`submitPpdScreening`). */
  screeningAudioUrl: string | null
}

function parsePpdAnswers(raw: unknown): PpdAnswerRow[] {
  if (!Array.isArray(raw)) return []
  const out: PpdAnswerRow[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const m = item as Record<string, unknown>
    const score = m.score
    const audio = m.audioUrl
    const labelRaw = m.selectedLabel ?? m.optionText
    out.push({
      id: typeof m.id === 'string' ? m.id : '',
      questionText: typeof m.text === 'string' ? m.text : '',
      score: typeof score === 'number' && Number.isFinite(score) ? score : null,
      selectedLabel: typeof labelRaw === 'string' ? labelRaw : '',
      answerText: typeof m.answerText === 'string' ? m.answerText : '',
      audioUrl: typeof audio === 'string' && audio.length > 0 ? audio : '',
    })
  }
  return out
}

export type MoodLogRow = {
  id: string
  date: Date | null
  mood: string
}

export type MealIngredientRow = {
  id: string
  name: string
}

export type MealLogRow = {
  id: string
  loggedAt: Date | null
  imageUrl: string
  ingredients: MealIngredientRow[]
  carbsGrams: number | null
  proteinGrams: number | null
  ironMg: number | null
  folateMcg: number | null
}

export type TimelineItem = {
  id: string
  kind: 'check_in' | 'ppd' | 'mood' | 'meal'
  at: Date | null
  title: string
  detail: string
}

export function usePatientClinicalData(patientUid: string | null): {
  checkIns: CheckInRow[]
  ppdScreenings: PpdScreeningRow[]
  moodLogs: MoodLogRow[]
  mealLogs: MealLogRow[]
  timeline: TimelineItem[]
  loading: boolean
  error: string | null
} {
  const [checkIns, setCheckIns] = useState<CheckInRow[]>([])
  const [ppdScreenings, setPpdScreenings] = useState<PpdScreeningRow[]>([])
  const [moodLogs, setMoodLogs] = useState<MoodLogRow[]>([])
  const [mealLogs, setMealLogs] = useState<MealLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!patientUid) {
      setCheckIns([])
      setPpdScreenings([])
      setMoodLogs([])
      setMealLogs([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    // Firestore caps how many docs we fetch per collection (not “unlimited history”).
    // We sort client-side; raise these if mothers have very long journeys.
    const qCheck = query(
      collection(db, 'checkIns'),
      where('userId', '==', patientUid),
      limit(200),
    )
    const qPpd = query(
      collection(db, 'ppdScreenings'),
      where('userId', '==', patientUid),
      limit(100),
    )
    const qMood = query(
      collection(db, 'moodLogs'),
      where('userId', '==', patientUid),
      limit(200),
    )
    const qMeals = query(
      collection(db, 'meals'),
      where('userId', '==', patientUid),
      limit(200),
    )

    let unsubCheck: Unsubscribe | undefined
    let unsubPpd: Unsubscribe | undefined
    let unsubMood: Unsubscribe | undefined
    let unsubMeals: Unsubscribe | undefined
    const got = { check: false, ppd: false, mood: false, meals: false }
    const tryFinishLoading = () => {
      if (got.check && got.ppd && got.mood && got.meals) setLoading(false)
    }

    const fail = (msg: string) => {
      setError(msg)
      setLoading(false)
    }

    try {
      unsubCheck = onSnapshot(
        qCheck,
        (snap) => {
          const rows: CheckInRow[] = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>
            return {
              id: d.id,
              loggedAt: timestampToDate(data.loggedAt ?? data.createdAt),
              symptoms: formatSymptomIds(data.symptoms),
              severity: asString(data.severity) || '—',
              notes: asString(data.notes),
            }
          })
          rows.sort((a, b) => (b.loggedAt?.getTime() ?? 0) - (a.loggedAt?.getTime() ?? 0))
          setCheckIns(rows)
          got.check = true
          tryFinishLoading()
        },
        (err) => fail(err.message || 'Unable to load check-ins.'),
      )

      unsubPpd = onSnapshot(
        qPpd,
        (snap) => {
          const rows: PpdScreeningRow[] = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>
            const score = data.totalScore
            const topAudio = data.audioUrl
            return {
              id: d.id,
              conductedAt: timestampToDate(data.conductedAt ?? data.createdAt),
              totalScore: typeof score === 'number' && Number.isFinite(score) ? score : null,
              riskLevel: asString(data.riskLevel) || '—',
              textSummary: asString(data.textSummary),
              language: asString(data.language),
              answers: parsePpdAnswers(data.answers),
              screeningAudioUrl:
                typeof topAudio === 'string' && topAudio.length > 0 ? topAudio : null,
            }
          })
          rows.sort((a, b) => (b.conductedAt?.getTime() ?? 0) - (a.conductedAt?.getTime() ?? 0))
          setPpdScreenings(rows)
          got.ppd = true
          tryFinishLoading()
        },
        (err) => fail(err.message || 'Unable to load PPD screenings.'),
      )

      unsubMood = onSnapshot(
        qMood,
        (snap) => {
          const rows: MoodLogRow[] = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>
            return {
              id: d.id,
              date: timestampToDate(data.date),
              mood: asString(data.mood) || '—',
            }
          })
          rows.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
          setMoodLogs(rows)
          got.mood = true
          tryFinishLoading()
        },
        (err) => fail(err.message || 'Unable to load mood logs.'),
      )

      unsubMeals = onSnapshot(
        qMeals,
        (snap) => {
          const rows: MealLogRow[] = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>
            const nutrients =
              typeof data.nutrients === 'object' && data.nutrients != null
                ? (data.nutrients as Record<string, unknown>)
                : {}
            const rawIngredients = Array.isArray(data.ingredients) ? data.ingredients : []
            const ingredients: MealIngredientRow[] = rawIngredients
              .map((item) => {
                if (typeof item !== 'object' || item == null) return null
                const x = item as Record<string, unknown>
                const name = asString(x.name).trim()
                if (!name) return null
                return { id: asString(x.id), name }
              })
              .filter((v): v is MealIngredientRow => v != null)
            const toNum = (v: unknown): number | null =>
              typeof v === 'number' && Number.isFinite(v) ? v : null
            return {
              id: d.id,
              loggedAt: timestampToDate(data.loggedAt ?? data.createdAt),
              imageUrl: asString(data.imageUrl),
              ingredients,
              carbsGrams: toNum(nutrients.carbsGrams),
              proteinGrams: toNum(nutrients.proteinGrams),
              ironMg: toNum(nutrients.ironMg),
              folateMcg: toNum(nutrients.folateMcg),
            }
          })
          rows.sort((a, b) => (b.loggedAt?.getTime() ?? 0) - (a.loggedAt?.getTime() ?? 0))
          setMealLogs(rows)
          got.meals = true
          tryFinishLoading()
        },
        (err) => fail(err.message || 'Unable to load meal logs.'),
      )
    } catch (e: unknown) {
      fail(e instanceof Error ? e.message : 'Unable to subscribe to clinical data.')
    }

    return () => {
      unsubCheck?.()
      unsubPpd?.()
      unsubMood?.()
      unsubMeals?.()
    }
  }, [patientUid])

  const timeline = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = []
    for (const c of checkIns) {
      const sym = c.symptoms.length ? c.symptoms.join(', ') : 'No symptoms listed'
      items.push({
        id: `ci-${c.id}`,
        kind: 'check_in',
        at: c.loggedAt,
        title: `Check-in (${c.severity})`,
        detail: sym + (c.notes ? ` · ${c.notes}` : ''),
      })
    }
    for (const p of ppdScreenings) {
      const score =
        p.totalScore != null ? `Score ${p.totalScore}` : 'Score pending'
      items.push({
        id: `ppd-${p.id}`,
        kind: 'ppd',
        at: p.conductedAt,
        title: `PPD / EPDS · ${score}`,
        detail: [p.riskLevel && `Risk: ${p.riskLevel}`, p.textSummary].filter(Boolean).join(' · '),
      })
    }
    for (const m of moodLogs) {
      items.push({
        id: `mood-${m.id}`,
        kind: 'mood',
        at: m.date,
        title: `Mood: ${m.mood}`,
        detail: '',
      })
    }
    for (const meal of mealLogs) {
      const nutrients = [
        meal.proteinGrams != null && `Protein ${meal.proteinGrams.toFixed(1)}g`,
        meal.ironMg != null && `Iron ${meal.ironMg.toFixed(1)}mg`,
      ]
        .filter(Boolean)
        .join(' · ')
      const ingredientPreview = meal.ingredients.slice(0, 3).map((i) => i.name).join(', ')
      items.push({
        id: `meal-${meal.id}`,
        kind: 'meal',
        at: meal.loggedAt,
        title: 'Meal log',
        detail: [ingredientPreview, nutrients].filter(Boolean).join(' · '),
      })
    }
    items.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0))
    // Full merged list; Patient Detail trims in the UI. Track record page & PDF use all rows.
    return items
  }, [checkIns, ppdScreenings, moodLogs, mealLogs])

  return { checkIns, ppdScreenings, moodLogs, mealLogs, timeline, loading, error }
}
