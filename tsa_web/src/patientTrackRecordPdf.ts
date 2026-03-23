import { jsPDF } from 'jspdf'

function fmt(d: Date | null): string {
  if (!d) return '—'
  try {
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

const MARGIN = 48
const LINE = 11

function newPageY(doc: jsPDF, y: number, block: number): number {
  const h = doc.internal.pageSize.getHeight()
  if (y + block > h - MARGIN) {
    doc.addPage()
    return MARGIN
  }
  return y
}

function writeParagraph(
  doc: jsPDF,
  y: number,
  text: string,
  maxW: number,
  fontSize = 9,
): number {
  doc.setFontSize(fontSize)
  const lines = doc.splitTextToSize(text || '—', maxW)
  for (const line of lines) {
    y = newPageY(doc, y, LINE)
    doc.text(line, MARGIN, y)
    y += LINE
  }
  return y
}

function heading(doc: jsPDF, y: number, title: string): number {
  y = newPageY(doc, y, 24)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, MARGIN, y)
  doc.setFont('helvetica', 'normal')
  return y + 16
}

export type TrackRecordPdfAlert = {
  createdAt: Date | null
  status: string
  summary: string
}

export type TrackRecordPdfReferral = {
  referredAt: Date | null
  previousFacilityName: string
  newFacilityName: string
  clinicalHandoffSummary: string | null
}

export type TrackRecordPdfNote = {
  createdAt: Date | null
  authorDisplayName: string
  facilityLabel: string
  content: string
}

export function downloadPatientClinicalTrackPdf(params: {
  patientName: string
  staffFacilityLabel: string
  generatedAt: Date
  demographics: Record<string, string>
  checkIns: Array<{
    loggedAt: Date | null
    severity: string
    symptoms: string[]
    notes: string
  }>
  ppdScreenings: Array<{
    conductedAt: Date | null
    totalScore: number | null
    riskLevel: string
    textSummary: string
  }>
  mealLogs: Array<{
    loggedAt: Date | null
    ingredients: string[]
    carbsGrams: number | null
    proteinGrams: number | null
    ironMg: number | null
    folateMcg: number | null
  }>
  moodLogs: Array<{ date: Date | null; mood: string }>
  timeline: Array<{ at: Date | null; title: string; detail: string }>
  alerts: TrackRecordPdfAlert[]
  referrals: TrackRecordPdfReferral[]
  clinicalNotes: TrackRecordPdfNote[]
}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const maxW = doc.internal.pageSize.getWidth() - MARGIN * 2

  let y = MARGIN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Thryve — clinical track record', MARGIN, y)
  y += 22
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  y = writeParagraph(doc, y, `Patient: ${params.patientName}`, maxW, 10)
  y = writeParagraph(
    doc,
    y,
    `Exported: ${fmt(params.generatedAt)} · Staff facility: ${params.staffFacilityLabel}`,
    maxW,
    9,
  )
  y += 8

  y = heading(doc, y, 'Demographics & identifiers')
  for (const [k, v] of Object.entries(params.demographics)) {
    if (!v) continue
    y = writeParagraph(doc, y, `${k}: ${v}`, maxW, 9)
  }
  y += 6

  y = heading(doc, y, 'Facility alerts (this facility’s queue)')
  if (params.alerts.length === 0) {
    y = writeParagraph(doc, y, 'None.', maxW, 9)
  } else {
    for (const a of params.alerts) {
      y = writeParagraph(
        doc,
        y,
        `${fmt(a.createdAt)} · ${a.status}\n${a.summary || '—'}`,
        maxW,
        9,
      )
      y += 4
    }
  }
  y += 6

  y = heading(doc, y, 'Check-ins & symptoms')
  if (params.checkIns.length === 0) {
    y = writeParagraph(doc, y, 'None.', maxW, 9)
  } else {
    for (const c of params.checkIns) {
      const sym = c.symptoms.length ? c.symptoms.join(', ') : '—'
      y = writeParagraph(
        doc,
        y,
        `${fmt(c.loggedAt)} · ${c.severity}\nSymptoms: ${sym}${c.notes ? `\nNotes: ${c.notes}` : ''}`,
        maxW,
        9,
      )
      y += 4
    }
  }
  y += 6

  y = heading(doc, y, 'PPD / EPDS screenings')
  if (params.ppdScreenings.length === 0) {
    y = writeParagraph(doc, y, 'None.', maxW, 9)
  } else {
    for (const p of params.ppdScreenings) {
      y = writeParagraph(
        doc,
        y,
        `${fmt(p.conductedAt)} · Score: ${p.totalScore ?? 'pending'} · Risk: ${p.riskLevel}\n${p.textSummary || ''}`,
        maxW,
        9,
      )
      y += 4
    }
  }
  y += 6

  y = heading(doc, y, 'Meal logs')
  if (params.mealLogs.length === 0) {
    y = writeParagraph(doc, y, 'None.', maxW, 9)
  } else {
    for (const m of params.mealLogs) {
      const ingredients = m.ingredients.length ? m.ingredients.join(', ') : '—'
      const nutrients = [
        m.carbsGrams != null ? `Carbs ${m.carbsGrams.toFixed(1)}g` : '',
        m.proteinGrams != null ? `Protein ${m.proteinGrams.toFixed(1)}g` : '',
        m.ironMg != null ? `Iron ${m.ironMg.toFixed(1)}mg` : '',
        m.folateMcg != null ? `Folate ${m.folateMcg.toFixed(1)}mcg` : '',
      ]
        .filter(Boolean)
        .join(' · ')
      y = writeParagraph(
        doc,
        y,
        `${fmt(m.loggedAt)}\nIngredients: ${ingredients}${nutrients ? `\n${nutrients}` : ''}`,
        maxW,
        9,
      )
      y += 4
    }
  }
  y += 6

  y = heading(doc, y, 'Mood log')
  if (params.moodLogs.length === 0) {
    y = writeParagraph(doc, y, 'None.', maxW, 9)
  } else {
    for (const m of params.moodLogs) {
      y = writeParagraph(doc, y, `${fmt(m.date)} · ${m.mood}`, maxW, 9)
    }
  }
  y += 6

  y = heading(doc, y, 'Combined timeline (check-ins, EPDS, meals, mood)')
  if (params.timeline.length === 0) {
    y = writeParagraph(doc, y, 'None.', maxW, 9)
  } else {
    for (const t of params.timeline) {
      y = writeParagraph(
        doc,
        y,
        `${fmt(t.at)} · ${t.title}\n${t.detail || ''}`,
        maxW,
        9,
      )
      y += 4
    }
  }
  y += 6

  y = heading(doc, y, 'Facility transfers & handoff log')
  if (params.referrals.length === 0) {
    y = writeParagraph(doc, y, 'None logged.', maxW, 9)
  } else {
    for (const r of params.referrals) {
      y = writeParagraph(
        doc,
        y,
        `${fmt(r.referredAt)} · ${r.previousFacilityName} → ${r.newFacilityName}\n${r.clinicalHandoffSummary || ''}`,
        maxW,
        9,
      )
      y += 4
    }
  }
  y += 6

  y = heading(doc, y, 'Staff clinical notes')
  if (params.clinicalNotes.length === 0) {
    y = writeParagraph(doc, y, 'None.', maxW, 9)
  } else {
    for (const n of params.clinicalNotes) {
      y = writeParagraph(
        doc,
        y,
        `${fmt(n.createdAt)} · ${n.authorDisplayName} · ${n.facilityLabel}\n${n.content}`,
        maxW,
        9,
      )
      y += 6
    }
  }

  doc.save(
    `Thryve-track-record-${params.patientName.replace(/\s+/g, '-').slice(0, 40) || 'patient'}.pdf`,
  )
}
