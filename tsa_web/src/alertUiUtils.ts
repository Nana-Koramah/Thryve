import type { FacilityAlert } from './useAlertsAtFacility'

export function formatElapsedSince(createdAt: Date | null): string {
  if (!createdAt) return '—'
  const sec = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 1000))
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${m}m`
}

/** Priority bucket for staff filtering (Red-flag table). */
export type AlertPriorityCategory = 'critical' | 'high_epds' | 'moderate'

export type AlertPriorityFilter = 'all' | AlertPriorityCategory

export function alertPriorityCategory(a: FacilityAlert): AlertPriorityCategory {
  if (a.source === 'ppd_screening') return 'high_epds'
  const sev = a.severity.toLowerCase()
  if (sev === 'high' && a.source === 'check_in') return 'critical'
  return 'moderate'
}

/** Map / table priority label from alert. */
export function alertPriorityLabel(a: FacilityAlert): string {
  if (a.severity.toLowerCase() === 'high') {
    return a.source === 'ppd_screening' ? 'High (EPDS)' : 'Critical'
  }
  if (a.source === 'ppd_screening') return 'High (EPDS)'
  return 'Moderate'
}

/** CSS modifier for escalation pills (matches existing tsa-pill--* classes). */
export function alertPriorityPillClass(a: FacilityAlert): string {
  if (a.severity.toLowerCase() === 'high' && a.source === 'check_in') {
    return 'tsa-pill tsa-pill--urgent'
  }
  if (a.source === 'ppd_screening' || a.severity.toLowerCase() === 'high') {
    return 'tsa-pill tsa-pill--ppd'
  }
  return 'tsa-pill tsa-pill--stable'
}

/**
 * Spread markers around facility hub so multiple alerts remain visible (not stacked).
 */
/** Styling for “time open” column on escalations table. */
export function elapsedVisualTier(createdAt: Date | null): 'critical' | 'warning' | 'ok' {
  if (!createdAt) return 'ok'
  const minutes = (Date.now() - createdAt.getTime()) / 60000
  if (minutes >= 45) return 'critical'
  if (minutes >= 20) return 'warning'
  return 'ok'
}

/** “Open” column styling — matches severity of wait time. */
export function elapsedOpenTimeClass(tier: 'critical' | 'warning' | 'ok'): string {
  if (tier === 'critical') return 'text-sm font-semibold text-rose-600 tabular-nums'
  if (tier === 'warning') return 'text-sm font-medium text-amber-700 tabular-nums'
  return 'text-sm text-slate-700 tabular-nums'
}

/** Smaller type for Red-flag Alerts table only (Live Feed keeps default). */
export function elapsedOpenTimeClassCompact(tier: 'critical' | 'warning' | 'ok'): string {
  if (tier === 'critical') return 'text-xs font-semibold text-rose-600 tabular-nums leading-snug'
  if (tier === 'warning') return 'text-xs font-medium text-amber-700 tabular-nums leading-snug'
  return 'text-xs text-slate-700 tabular-nums leading-snug'
}

export function offsetAlertMarker(
  index: number,
  baseLat: number,
  baseLng: number,
): [number, number] {
  const angle = (index * 137.508) * (Math.PI / 180)
  const radius = 0.0016 * (1 + (index % 6) * 0.2)
  return [baseLat + radius * Math.cos(angle), baseLng + radius * Math.sin(angle)]
}

/** Profile fields from `users/{uid}` for header search on Red-flag page. */
export type AlertUserSearchMeta = {
  fullName: string
  ghanaCardId: string
  nhisId: string
}

export function alertMatchesPatientSearch(
  a: FacilityAlert,
  query: string,
  meta: AlertUserSearchMeta | undefined,
): boolean {
  const t = query.trim().toLowerCase()
  if (!t) return true
  const compact = t.replace(/\s+/g, '')
  const name = (meta?.fullName || a.motherName || '').toLowerCase()
  const gha = (meta?.ghanaCardId || '').toLowerCase().replace(/\s+/g, '')
  const nhis = (meta?.nhisId || '').toLowerCase().replace(/\s+/g, '')
  const summary = (a.summary || '').toLowerCase()
  return (
    name.includes(t) ||
    summary.includes(t) ||
    (compact.length > 0 && (gha.includes(compact) || nhis.includes(compact)))
  )
}
