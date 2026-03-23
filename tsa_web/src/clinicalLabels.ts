/** Symptom IDs from mobile `CheckInService` / red-flag check-in. */
export const CHECK_IN_SYMPTOM_LABELS: Record<string, string> = {
  heavy_bleeding: 'Heavy bleeding',
  severe_headache: 'Severe headache',
  blurred_vision: 'Blurred vision',
  extreme_pain: 'Extreme pain',
  high_fever: 'High fever',
  hard_to_breathe: 'Hard to breathe',
}

export function formatSymptomIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  return ids
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .map((id) => CHECK_IN_SYMPTOM_LABELS[id] ?? id.replace(/_/g, ' '))
}
