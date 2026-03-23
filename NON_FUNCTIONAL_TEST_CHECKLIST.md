# Non-Functional Test Checklist

## Security
- [ ] Confirm Firestore rules block cross-facility reads for `users`, `alerts`, `meals`, `clinicalNotes`.
- [ ] Confirm Storage rules block cross-facility reads for `users/{uid}/ppd/**`.
- [ ] Confirm unauthenticated users cannot read/write protected collections.
- [ ] Verify no sensitive tokens/PII appear in client logs.

## Performance
- [ ] Patient Details first meaningful content loads in acceptable time on average network (< 3s target).
- [ ] EPDS response page with 10 answers + multiple audios remains responsive.
- [ ] Track Record PDF generation completes without UI freeze for typical data volume.
- [ ] Live Feed remains responsive with expected patient count.

## Reliability and Data Integrity
- [ ] Referral operation is atomic enough for practical consistency (user link + alert transfer + referral log).
- [ ] No data loss on EPDS submit with mixed text/audio.
- [ ] Meal logs and notes remain consistent after page refresh and re-login.
- [ ] Timestamp ordering is correct (newest-first) across pages.

## Usability and Accessibility (Baseline)
- [ ] Navigation labels are clear (EPDS page entry, back controls).
- [ ] Error messages are understandable (permission denied, invalid referral, etc.).
- [ ] Keyboard accessibility for key buttons/inputs on TSA web.
- [ ] Contrast and readability acceptable for dashboard text and badges.

## Compatibility
- [ ] TSA works on latest Chrome.
- [ ] TSA works on latest Edge.
- [ ] Mobile audio capture and upload works on at least one Android test device.

## Observability and Operations
- [ ] Deployment commands documented and repeatable.
- [ ] Rule deployments tracked (Firestore/Storage).
- [ ] Known limitations documented in test report.
