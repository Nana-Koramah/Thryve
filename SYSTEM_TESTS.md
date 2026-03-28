# System Tests

System tests validate complete end-to-end behavior from user perspective across the full stack.

## ST-001 Staff clinical review end-to-end
- Scenario:
  - Mother submits check-in, EPDS answers (with notes/audio), and meal logs.
  - Staff opens TSA and reviews patient.
- Expected:
  - Patient details loads complete recent sections.
  - EPDS detail page shows question choices, notes, audio.
  - Meals appear in nutritional sections.

## ST-002 High-risk EPDS to triage handling
- Scenario:
  - Mother submits EPDS with high score.
  - Staff sees alert and manages case.
- Expected:
  - Alert appears in facility list.
  - Case actions/status updates succeed.

## ST-003 Referral handoff end-to-end
- Scenario:
  - Staff refers patient to another facility.
  - Destination staff verifies case.
- Expected:
  - Patient moves to destination facility queue.
  - Active alerts visible at destination.
  - Referral history logged with handoff.

## ST-004 Clinical notes continuity and reporting
- Scenario:
  - Multiple staff add notes over time.
  - Staff downloads patient PDF.
- Expected:
  - Historical notes visible in app.
  - Notes included in PDF with metadata.

## ST-005 Access control system behavior
- Scenario:
  - Staff from wrong facility attempts access.
- Expected:
  - Protected patient data and audio are denied by rules.

## ST-006 Deployment smoke test
- Scenario:
  - Deploy latest web build and rules.
- Expected:
  - Login works.
  - Live Feed, Patient Details, EPDS page, meal logs, notes, and referral all function.

## Suggested sign-off criteria
- All ST cases pass on production-like environment.
- No critical defects open.
- Evidence attached in `TEST_REPORT_TEMPLATE.md`.
