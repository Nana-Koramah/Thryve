# Integration Tests

Integration tests verify interaction between modules/services (UI + Firestore + Storage + rules).

## IT-001 EPDS submit stores full payload
- Flow:
  - Mobile EPDS submit with scores, notes, and multiple audio recordings.
- Verify:
  - `ppdScreenings` document created with `answers[]`.
  - Each answered question keeps `score`, `selectedLabel`, optional `answerText`.
  - Each recorded question gets `audioUrl`.

## IT-002 TSA EPDS page reads and renders stored payload
- Flow:
  - TSA opens patient EPDS responses page.
- Verify:
  - Same `answers[]` values appear in UI.
  - Audio controls play corresponding `audioUrl`.

## IT-003 Referral transaction consistency
- Flow:
  - Staff refers patient to a different facility.
- Verify:
  - `users/{uid}.linkedFacilityId` updated.
  - active `alerts` transferred to destination facility.
  - `patientReferrals` entry created with handoff summary.

## IT-004 Meal logging integration
- Flow:
  - Mobile logs a meal with image and ingredients.
- Verify:
  - Storage image under `users/{uid}/meals/...`.
  - Firestore `meals` doc created with `nutrients` and `ingredients`.
  - TSA Patient Details and Track Record display meal data.

## IT-005 Clinical notes integration
- Flow:
  - Staff adds note in TSA.
- Verify:
  - Firestore `clinicalNotes` doc created.
  - note history visible in Patient Details.
  - notes included in Patient Record and exported PDF.

## IT-006 Rules integration (security boundaries)
- Validate:
  - same-facility staff can read `meals`, `ppdScreenings`, and PPD audio.
  - cross-facility staff denied.

## Execution guidance
- Run against deployed environment (`thryve-27216`) with test accounts in two facilities.
- Capture evidence: Firestore docs, Storage objects, UI screenshots/video.
