# Thryve Test Plan

## Scope
- In scope: TSA web staff workflows and Firebase-backed data flows currently implemented.
- Out of scope: Play Store/App Store release checks, analytics instrumentation, payment/billing.

## Test Objectives
- Verify implemented functional requirements work end-to-end.
- Verify non-functional qualities at an acceptable baseline (security, reliability, performance, usability).
- Produce repeatable evidence for demo/review and deployment sign-off.

## Test Environment
- Firebase project: `thryve-27216`
- Web app: `https://thryve-27216.web.app`
- Mobile app: local APK install from `thryve_mobile`
- Browsers: Chrome (primary), Edge (secondary)
- Devices: at least one Android device for capture/upload flows

## Test Data
- At least 2 staff users at different facilities.
- At least 2 mother users linked to different facilities.
- EPDS submissions:
  - one with notes only
  - one with per-question audio on multiple questions
  - one high-risk score to trigger alert
- At least 2 meal logs with different ingredients.
- At least 2 clinical notes by different staff.

## Entry Criteria
- Latest web build deployed to hosting.
- Firestore and Storage rules deployed.
- Staff and mother accounts available.

## Exit Criteria
- No critical functional failures.
- All high-priority functional tests pass.
- Security checks (access boundaries) pass.
- Known limitations documented in test report.

## Test Deliverables
- `FUNCTIONAL_TEST_CASES.md`
- `NON_FUNCTIONAL_TEST_CHECKLIST.md`
- `UAT_CHECKLIST.md`
- `TEST_REPORT_TEMPLATE.md`
