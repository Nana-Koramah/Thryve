# Functional Test Cases

## Legend
- Priority: P0 (critical), P1 (high), P2 (medium)
- Type: Positive / Negative / Authorization

## Authentication and Staff Context

### FT-001 Staff login and facility context (P0, Positive)
- Preconditions: valid staff account exists.
- Steps:
  - Open TSA web app.
  - Log in with staff credentials.
  - Open Patient Details from Live Feed.
- Expected:
  - Login succeeds.
  - Staff sees only patients for staff facility.

### FT-002 Unauthorized staff access blocked across facilities (P0, Authorization)
- Preconditions: staff A and patient linked to facility B.
- Steps:
  - Sign in as staff A.
  - Attempt to query/open patient in facility B (direct navigation or query path).
- Expected:
  - Data does not load; access denied behavior shown.

## EPDS / PPD Responses and Audio

### FT-010 Open EPDS response page from Patient Details (P0, Positive)
- Preconditions: patient has at least one `ppdScreenings` doc.
- Steps:
  - Open patient.
  - Click "View full questionnaire responses".
- Expected:
  - Dedicated EPDS page opens.
  - Back control returns to Patient Details.

### FT-011 EPDS answers render (choice, notes, score) (P0, Positive)
- Preconditions: screening contains `answers` with `selectedLabel`, `answerText`, `score`.
- Steps:
  - Expand a screening row.
- Expected:
  - "Answer selected" text is visible.
  - Notes show when present.
  - Score/points shown for each item.

### FT-012 Multiple per-question audio playback (P0, Positive)
- Preconditions: single screening has 2+ answers with valid `audioUrl`.
- Steps:
  - Expand screening.
  - Play each audio control.
- Expected:
  - Each audio plays correctly.
  - No cross-question overwrite in UI.

### FT-013 Legacy/older records gracefully handled (P1, Negative)
- Preconditions: older screening lacking `selectedLabel` and/or missing `audioUrl`.
- Steps:
  - Open older screening.
- Expected:
  - UI falls back to score-only messaging.
  - No crash.

## Referral Flow

### FT-020 Refer patient to another facility (P0, Positive)
- Preconditions: patient linked to staff facility; destination facility exists.
- Steps:
  - Open Patient Details.
  - Choose destination facility.
  - Confirm referral.
- Expected:
  - `users/{uid}.linkedFacilityId` and `linkedFacilityName` updated to destination.
  - Active alerts from previous facility move to destination and become `new`.
  - Referral log row appears in transfer history.

### FT-021 Referral denied for same destination as current facility (P1, Negative)
- Steps:
  - Select current linked facility as destination.
  - Confirm referral.
- Expected:
  - Request blocked with clear error.

## Meal Logs

### FT-030 Meal logs visible on TSA Patient Details and Record (P0, Positive)
- Preconditions: patient has `meals` docs.
- Steps:
  - Open Patient Details.
  - Open full track record.
- Expected:
  - Meal section appears in both pages.
  - Nutrient summaries and ingredients visible.

### FT-031 Meal data included in timeline and PDF (P1, Positive)
- Steps:
  - Open track record timeline.
  - Download PDF.
- Expected:
  - Timeline includes meal events.
  - PDF has meal logs section.

## Clinical Notes

### FT-040 Staff can create and view note history (P0, Positive)
- Preconditions: staff at patient facility.
- Steps:
  - Add note on Patient Details.
  - Reload page.
- Expected:
  - Note persists in Firestore `clinicalNotes`.
  - Previous notes remain visible in descending recency.

### FT-041 Clinical notes appear in track record and PDF (P0, Positive)
- Steps:
  - Open Patient Record.
  - Download PDF.
- Expected:
  - Notes list appears in record page.
  - Notes section present in PDF with content and metadata.

## Rules/Authorization

### FT-050 Storage audio access for staff at same facility (P0, Authorization)
- Preconditions: patient and staff in same facility; EPDS audio exists.
- Steps:
  - Play audio in TSA as staff.
- Expected:
  - Playback succeeds using Storage URL.

### FT-051 Storage audio denied for wrong facility staff (P0, Authorization)
- Preconditions: staff from different facility.
- Steps:
  - Attempt playback of same audio.
- Expected:
  - Access denied.

### FT-052 Meals read denied for wrong facility staff (P0, Authorization)
- Preconditions: staff from different facility.
- Steps:
  - Attempt to load patient meal logs.
- Expected:
  - Read blocked by rules.
