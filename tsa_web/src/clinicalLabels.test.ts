import { describe, expect, it } from 'vitest'
import { formatSymptomIds } from './clinicalLabels'

describe('formatSymptomIds', () => {
  it('maps known symptom ids to display labels', () => {
    expect(formatSymptomIds(['heavy_bleeding', 'hard_to_breathe'])).toEqual([
      'Heavy bleeding',
      'Hard to breathe',
    ])
  })

  it('falls back to underscore replacement for unknown ids', () => {
    expect(formatSymptomIds(['unknown_symptom'])).toEqual(['unknown symptom'])
  })

  it('returns empty for invalid payloads', () => {
    expect(formatSymptomIds(null)).toEqual([])
    expect(formatSymptomIds({})).toEqual([])
    expect(formatSymptomIds(123)).toEqual([])
  })
})
