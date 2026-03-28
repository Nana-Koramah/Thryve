# Unit Tests

Unit tests verify isolated logic (single function/module) without full workflow dependencies.

## UT-001 Symptom label formatting
- Module: `tsa_web/src/clinicalLabels.ts`
- Objective: ensure symptom IDs map to readable labels.
- Input:
  - `['heavy_bleeding', 'hard_to_breathe']`
- Expected:
  - `['Heavy bleeding', 'Hard to breathe']`

## UT-002 Unknown symptom fallback
- Module: `tsa_web/src/clinicalLabels.ts`
- Input:
  - `['unknown_symptom']`
- Expected:
  - `['unknown symptom']`

## UT-003 Invalid symptom payload handling
- Module: `tsa_web/src/clinicalLabels.ts`
- Input:
  - `null`, `{}`, `123`
- Expected:
  - `[]` (no crash)

## UT-004 EPDS risk threshold logic
- Module: `thryve_mobile/lib/check_in_screen.dart` (`_computeRiskLevel`)
- Cases:
  - score `9` -> `low`
  - score `10` -> `medium`
  - score `13` -> `high`

## UT-005 Selected answer label generation
- Module: `thryve_mobile/lib/check_in_screen.dart` (`_epdsAnswerSelectedLabel`)
- Objective: selected option text is stored correctly for TSA display.
- Expected:
  - Returns selected wording for valid score
  - Returns empty string for null score

## How to execute (recommended)
- Web unit tests: add a test runner (Vitest/Jest) and run via `npm test`.
- Mobile unit/widget baseline: `flutter test` in `thryve_mobile`.
