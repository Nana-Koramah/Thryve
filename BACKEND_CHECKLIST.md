# Thryve Backend Implementation Checklist (Firebase & Firestore)

This document is the step-by-step directive for building the **backend** for the **Thryve mobile app** (mothers) and **Thryve System Analytics (TSA)** web app (hospital staff) using **Firebase** — primarily **Firestore** for data and **Firebase Auth** for identity. Both apps talk to the same Firebase project. Work through the sections in order; check off items as they are done.

---

## Phase 0: Firebase foundation

### 0.1 Firebase project
- [ ] Create a single **Firebase project** (e.g. `thryve-production`) in the [Firebase Console](https://console.firebase.google.com).
- [ ] Enable **Firebase Authentication** (Email/Password provider for mothers and staff).
- [ ] Create a **Firestore Database** (Native mode); choose region (e.g. closest to Ghana if applicable).
- [ ] Enable **Firebase Storage** for profile photos and meal images.
- [ ] (Optional) Enable **Cloud Functions** if you need server-side logic (e.g. auto-create red flags, send notifications, aggregates).

### 0.2 Register clients
- [ ] **Mobile:** Add Android app in Firebase (package name from `thryve_mobile`); download `google-services.json` into `thryve_mobile/android/app`.
- [ ] **Web (TSA):** Add Web app in Firebase; copy the `firebaseConfig` object for use in `tsa_web`.
- [ ] Restrict API keys / domains in Firebase Console (e.g. authorized domains for web) as needed for production.

### 0.3 SDK and config
- [ ] **Flutter:** Add `firebase_core` and `firebase_auth`, `cloud_firestore`, `firebase_storage` to `pubspec.yaml`; initialize Firebase in `main.dart` using default project.
- [ ] **TSA (React):** Install `firebase`; create a small `firebase.ts` (or `.js`) that initializes the app and exports `auth`, `db` (Firestore), `storage`. Initialize in app bootstrap.
- [ ] Keep config (e.g. `firebaseConfig`) in environment or config files; do not commit secrets if you later add a separate backend key.

### 0.4 Security baseline
- [ ] All access control will be enforced via **Firestore Security Rules** and **Storage Rules** (no custom server middleware). Plan rules so that only authenticated users can read/write as intended.
- [ ] Use HTTPS (Firebase clients do by default); never log or expose Auth tokens.

---

## Phase 1: Authentication & user documents

### 1.1 Mothers (mobile app)
- [ ] Use **Firebase Auth** Email/Password: `createUserWithEmailAndPassword` for signup and `signInWithEmailAndPassword` for login in Flutter.
- [ ] On first signup, create a **Firestore document** at `users/{uid}` with: `email`, `fullName`, `phone`, `ghanaCardId`, `primaryLanguage`, `dateOfBirth`, `linkedFacilityId` (nullable), `profilePhotoUrl` (nullable), `role: "mother"`, `createdAt`, `updatedAt`. Use the Auth `uid` as the document ID.
- [ ] Validate required fields (e.g. email format, password strength) in the app before calling Firebase; optionally use a **Cloud Function** (on `auth.userCreated`) to create the `users/{uid}` document and enforce schema.
- [ ] (Optional) Enable Email verification or Phone auth in Firebase Auth; document if deferred.

### 1.2 Staff (TSA web app)
- [ ] Staff also sign in with **Firebase Auth** Email/Password. Create a **Firestore document** at `staff/{uid}` with: `email`, `displayName`, `facilityId`, `role` (e.g. `nurse`, `doctor`, `admin`), `createdAt`, `updatedAt`. Use the Auth `uid` as the document ID.
- [ ] Staff accounts can be created by an admin (e.g. manually in Console, or via a Cloud Function / admin-only UI) that creates the Auth user and the `staff/{uid}` document with the correct `facilityId`.
- [ ] After login, TSA reads `staff/{uid}` to get `facilityId` and role; use these for all Firestore queries (no custom JWT claims required unless you prefer them for rules).

### 1.3 Security rules – auth only
- [ ] Firestore Rules: require `request.auth != null` for all reads/writes until you add resource-level rules (you will refine in later phases).
- [ ] Storage Rules: require `request.auth != null` for read/write until you add path-based rules.

---

## Phase 2: Facilities & mother–facility link

### 2.1 Facilities collection
- [ ] Create **Firestore collection** `facilities`. Document fields: `name`, `region`, `district`, `type` (e.g. hospital, clinic), `latitude`, `longitude`, `contactInfo` (map or string), `createdAt`, `updatedAt`. Use auto-generated IDs or meaningful IDs.
- [ ] **Option A:** Integrate Ghana Health Service facilities API and run a one-off or periodic script (e.g. Cloud Function or local script) to populate `facilities`.
- [ ] **Option B:** Manually or via script add seed data; expose a way for the mobile app to query facilities (see 2.2).
- [ ] Firestore Rules: allow **read** for any authenticated user (mothers need to search facilities); **write** only for admin/staff if you have an admin path, or restrict to Cloud Functions.

### 2.2 Querying facilities from mobile
- [ ] In the Flutter app, query `facilities` with optional `where`/`orderBy` (e.g. by `region` or `name`) and optional search (client-side filter or use a composite index). Display list and map; user selects a facility to link.
- [ ] Document the need for a **composite index** in Firestore if you use e.g. `where("region", "==", x).orderBy("name")`; create the index when Firestore suggests it.

### 2.3 Mother–facility linkage
- [ ] Store **linkedFacilityId** on the mother’s document `users/{uid}`. Allow it to be `null` (e.g. “Skip for now”).
- [ ] From the mobile app: **update** `users/{uid}` with `linkedFacilityId` when the user links or changes facility; **set to null** when they unlink. Enforce in Security Rules that only the authenticated user can update their own `users/{uid}` document.

---

## Phase 3: Mother profile & storage (mobile)

### 3.1 Profile read/write
- [ ] **Read profile:** Mobile app reads `users/{uid}` where `uid == FirebaseAuth.currentUser.uid` (single document get).
- [ ] **Update profile:** Mobile app updates `users/{uid}` (e.g. `fullName`, `phone`, `primaryLanguage`, `dateOfBirth`, `linkedFacilityId`, `profilePhotoUrl`). Validate and sanitize in the app; optionally validate in a Cloud Function if you want strict server-side checks.
- [ ] Firestore Rules: allow **read** and **write** for `users/{userId}` only when `request.auth.uid == userId`.

### 3.2 Profile photo (Firebase Storage)
- [ ] Create a **Storage** path such as `users/{uid}/profile/photo.jpg`. Mobile app uploads the image (e.g. after picking from camera/gallery); set content type and size limits in the app.
- [ ] After upload, get the **download URL** and update `users/{uid}.profilePhotoUrl` in Firestore.
- [ ] Storage Rules: allow read/write to `users/{userId}/**` only when `request.auth.uid == userId`.

---

## Phase 4: Check-ins, symptoms & PPD (mobile → Firestore)

### 4.1 Check-ins collection
- [ ] Create **Firestore collection** `checkIns`. Document fields: `userId` (mother’s uid), `facilityId` (denormalized from user at write time), `loggedAt` (Timestamp), `symptoms` (array or map), `severity` (string or number), `notes` (optional), `createdAt`.
- [ ] Mobile app: **add** a document to `checkIns` on submit; set `userId` to current user and `facilityId` from `users/{uid}.linkedFacilityId`.
- [ ] Firestore Rules: allow **create** and **read** for documents where `request.auth.uid == resource.data.userId` (mothers see only their own). Staff read access will be via `facilityId` in a later phase.
- [ ] Define in app logic when a check-in is “red flag” (e.g. certain symptoms or severity); when so, also create a document in `alerts` (see Phase 5).

### 4.2 PPD screenings collection
- [ ] Create **Firestore collection** `ppdScreenings`. Document fields: `userId`, `facilityId`, `conductedAt` (Timestamp), `totalScore` (number), `answers` (map or array), `riskLevel` (e.g. low/medium/high), `language` (optional), `createdAt`.
- [ ] Mobile app: on EPDS submit, compute `totalScore` and `riskLevel`; **add** a document to `ppdScreenings`. If score exceeds threshold (e.g. EPDS > 12 or > 20), create a document in `alerts` (Phase 5).
- [ ] Firestore Rules: allow **create** and **read** for documents where `request.auth.uid == resource.data.userId`.
- [ ] Document score thresholds and risk levels in this file or in app constants.

---

## Phase 5: Red flags / alerts (Firestore + TSA)

### 5.1 Alerts collection
- [ ] Create **Firestore collection** `alerts`. Document fields: `userId` (mother), `facilityId`, `source` (e.g. `check_in`, `ppd_screening`), `severity`, `status` (e.g. `new`, `acknowledged`, `resolved`), `summary`, `payload` (map: symptoms, score, etc.), `createdAt`, `updatedAt`, `resolvedAt` (optional), `resolvedBy` (optional staff uid). Optionally add `referredFacilityId`, `reroutedAt` for rerouting.
- [ ] **Create alert:** From the mobile app, when a check-in or PPD screening meets red-flag criteria, **add** a document to `alerts` with the mother’s `linkedFacilityId`. If no facility linked, decide policy (e.g. skip alert or store with null and handle in TSA).
- [ ] Alternatively, use a **Cloud Function** triggered on `checkIns` or `ppdScreenings` onCreate to create the `alerts` document when criteria are met (keeps logic in one place).
- [ ] (Optional) Use **Firebase Cloud Messaging** or Firestore listeners to notify TSA or facility when a new alert is created.

### 5.2 TSA – list and read alerts
- [ ] TSA (React): after staff login, read `staff/{uid}` to get `facilityId`. Query `alerts` with `where("facilityId", "==", facilityId)`, with optional filters (status, date range, severity) and `orderBy("createdAt", "desc")`. Paginate with `limit()` and `startAfter()` if needed.
- [ ] For case detail: **get** a single document `alerts/{alertId}`; ensure in Security Rules that only staff from the same facility can read it (see 5.4).
- [ ] Firestore Rules: allow **read** for `alerts` where `resource.data.facilityId` matches the staff’s facility (you need staff’s `facilityId` in rules – e.g. via `get(/databases/$(database)/documents/staff/$(request.auth.uid)).data.facilityId`). Allow **create** only for authenticated users (mothers) for their own linked facility; allow **update** only for staff of that facility.

### 5.3 TSA – update alert status and actions
- [ ] TSA: **update** `alerts/{alertId}` to set `status` (e.g. acknowledged, resolved), `resolvedAt`, `resolvedBy`, and optional resolution notes.
- [ ] (Optional) Subcollection `alerts/{alertId}/actions` to log discrete actions (e.g. “Home Visit Requested”, “Emergency Referral”, “Quick-call initiated”) with timestamp and staff uid for audit.

### 5.4 Firestore Rules summary for alerts
- [ ] Mothers: can **create** alerts where `request.auth.uid == request.resource.data.userId` and optionally `facilityId` matches their `users` document.
- [ ] Staff: can **read** and **update** alerts where `resource.data.facilityId == get(...staff/request.auth.uid).data.facilityId`. Deny create/delete by staff if not needed.

---

## Phase 6: Meals / Smart Plate (mobile → Firestore + Storage)

### 6.1 Meal logs collection
- [ ] Create **Firestore collection** `meals`. Document fields: `userId`, `facilityId`, `loggedAt` (Timestamp), `imageUrl` (optional, from Storage), `ingredients` (map or array), `nutrients` (map: e.g. carbs, protein, vitamins), `notes` (optional), `createdAt`.
- [ ] Mobile app: **add** a document to `meals`; upload meal photo to **Storage** at e.g. `users/{uid}/meals/{mealId}.jpg`, then set `imageUrl` to the download URL.
- [ ] Firestore Rules: allow **create** and **read** for `meals` where `request.auth.uid == resource.data.userId`. Staff read by facility in Phase 8.
- [ ] Storage Rules: allow read/write to `users/{userId}/meals/**` when `request.auth.uid == userId`.

### 6.2 Nutritional adherence (TSA)
- [ ] (Optional) TSA can compute adherence client-side by querying `meals` for a patient and aggregating over last N days; or add a **Cloud Function** that writes a summary to `users/{uid}/nutritionSummary` or a separate collection when meals are added.

---

## Phase 7: TSA – Live feed & patient list

### 7.1 Listing patients by facility
- [ ] TSA: get `facilityId` from `staff/{uid}`. Query **Firestore** `users` with `where("linkedFacilityId", "==", facilityId)`. Firestore Rules must allow staff to read `users` where `resource.data.linkedFacilityId == staff’s facilityId` (use `get()` in rules to read staff doc).
- [ ] For each patient, you may need to fetch “last check-in”, “last PPD score”, “open red flag” from `checkIns`, `ppdScreenings`, and `alerts` (e.g. separate queries or a denormalized “lastActivity” on `users` updated by Cloud Functions). Start simple: query users; then add latest check-in/alert per user if needed (batch or client-side).
- [ ] Support search by name (client-side filter or Firestore `where` + index) and pagination.

### 7.2 Live feed metrics
- [ ] **Active Red Flags:** Count documents in `alerts` where `facilityId == staff.facilityId` and `status in ["new", "acknowledged"]` (run a query with `where` and use snapshot size or a dedicated counter).
- [ ] **Pending Referrals:** If you have a `referrals` collection (Phase 10), count by facility and status; otherwise leave as 0 or mock.
- [ ] **Avg Triage Response:** Optionally store `firstAcknowledgedAt` on alerts when status first becomes acknowledged; compute average (e.g. in Cloud Function or client) for dashboard.

---

## Phase 8: TSA – Patient detail & clinical data

### 8.1 Single patient profile
- [ ] TSA: **get** `users/{patientId}` only if that user’s `linkedFacilityId` equals the logged-in staff’s `facilityId` (enforce in Firestore Rules: staff can read `users/{userId}` if `resource.data.linkedFacilityId == get(...staff/request.auth.uid).data.facilityId`).
- [ ] Fetch last N check-ins: query `checkIns` where `userId == patientId`, orderBy `loggedAt` desc, limit N. Same for `ppdScreenings` and open/resolved `alerts` for this `userId`.

### 8.2 Health progress timeline
- [ ] Build a combined timeline from `checkIns`, `ppdScreenings`, and `alerts` for the patient (same queries as above); merge and sort by date in the TSA client. Tag each event as “healthy check-in”, “red flag”, etc., for the UI.

### 8.3 Clinical notes (staff)
- [ ] Create **Firestore collection** `clinicalNotes` (or subcollection `patients/{patientId}/notes`). Document fields: `patientId`, `authorId` (staff uid), `facilityId`, `content`, `createdAt`, `updatedAt`.
- [ ] TSA: **add** or **set** a note (e.g. one note per visit or per day); **query** notes by `patientId` (and optionally `facilityId`). Show “last saved” from the latest document’s `updatedAt`.
- [ ] Firestore Rules: allow **read** and **write** only when staff’s `facilityId` matches the note’s `facilityId` and the patient is linked to that facility.

### 8.4 Identity and emergency contact
- [ ] Store Ghana Card ID, NHIS number, and emergency contact (name, relation, phone) on the mother’s `users/{uid}` document. Expose in TSA only when staff has access to that user (already enforced by rules in 8.1). “Initiate Quick-Call” can log an action (Phase 10) or just open tel: link; no backend change required beyond storing the contact.

---

## Phase 9: TSA – Escalation queue & case detail

### 9.1 Escalation list
- [ ] Same as Phase 5.2: query `alerts` by `facilityId`, filter by status if needed, order by `createdAt`. Compute “elapsed time” and “priority” in the client from `createdAt` and `severity`/payload. “Manage Case” navigates to case detail with `alertId`.

### 9.2 Case (red flag) detail
- [ ] TSA: **get** `alerts/{alertId}` (already allowed by rules if facility matches). Enrich with patient profile from `users/{userId}` (same user as `alerts.userId`). Display symptom breakdown, PPD result, and optional transcript/protocol from `payload` or separate subcollections.
- [ ] **Update** `alerts/{alertId}` for status (Resolved, Home Visit Required, Emergency Referral) and optional notes, `resolvedAt`, `resolvedBy`.

### 9.3 Protocol checklist and rerouting
- [ ] (Optional) Store a `protocolChecklist` map on the alert document (e.g. `{ gpsConfirmed: true, consciousnessChecked: true }`); TSA **update**s this map when staff checks items. “Protocol Deviation Warning” can be computed in the client from checklist state.
- [ ] (Optional) Add `referredFacilityId` and `reroutedAt` to the alert for rerouting; “Notify Regional Supervisor” can be a logged action in `alerts/{id}/actions` or a Cloud Function that sends email/FCM.

---

## Phase 10: Referrals, reports & optional features

### 10.1 Referrals collection
- [ ] If referrals are separate from alerts: create **Firestore collection** `referrals` with `fromFacilityId`, `toFacilityId`, `patientId`, `reason`, `status`, `createdAt`. TSA creates a document when “Refer Patient” is used; list referrals for facility with `where("fromFacilityId", "==", facilityId)` and status filter.
- [ ] Firestore Rules: staff can read/write referrals for their facility.

### 10.2 Institutional reports
- [ ] Define metrics (e.g. monthly red-flag count, referral count). Either query Firestore in TSA with date range and aggregate in the client, or add a **Cloud Function** that writes aggregated counts to a `reports` or `facilityStats` collection for fast reads.

### 10.3 Call / chat action logging
- [ ] “Initiate Quick-Call” / “Chat”: add a document to e.g. `patients/{patientId}/actions` or `alerts/{alertId}/actions` with type `quick_call` or `chat`, timestamp, and staff uid. No telephony integration required for the checklist.

---

## Phase 11: Client integration & polish

### 11.1 Mobile app (Flutter)
- [ ] Replace stubbed registration with **Firebase Auth** `createUserWithEmailAndPassword`; on success, create or update `users/{uid}` in Firestore with profile fields and `role: "mother"`.
- [ ] Replace stubbed login with **Firebase Auth** `signInWithEmailAndPassword`; persist auth state (Auth handles this; listen to `authStateChanges` for UI).
- [ ] Facility linkage: **update** `users/{uid}.linkedFacilityId`; fetch facility list from **Firestore** `facilities` collection (with indexes as needed).
- [ ] Profile: **get** `users/{uid}` for load; **update** for save; upload profile photo to **Storage** and set `profilePhotoUrl`.
- [ ] Check-in: **add** to `checkIns`; if red-flag criteria met, **add** to `alerts` (or rely on Cloud Function).
- [ ] PPD: **add** to `ppdScreenings`; if score exceeds threshold, **add** to `alerts`.
- [ ] Smart Plate: upload image to **Storage** under `users/{uid}/meals/`; **add** document to `meals` with `imageUrl` and nutrients.
- [ ] Add error handling and loading states for all Firebase calls; handle permission-denied (e.g. rules) with user-friendly messages.

### 11.2 TSA web app (React)
- [ ] Add **Firebase** init and **Firebase Auth** sign-in (Email/Password for staff). After login, fetch `staff/{uid}` to get `facilityId` and role.
- [ ] Live Feed: query **Firestore** `users` by `linkedFacilityId`; query `alerts` for counts and list; replace mock data with real queries and listeners if desired.
- [ ] Escalation page: query `alerts` by `facilityId`; “Manage Case” links to case detail (e.g. route with `alertId`); fetch `alerts/{alertId}` and `users/{userId}`.
- [ ] Patient Detail: fetch `users/{patientId}` (rules enforce facility); fetch `checkIns`, `ppdScreenings`, `alerts`, `clinicalNotes` for that patient; build timeline in client. **Add/update** clinical notes in `clinicalNotes` (or patient subcollection).
- [ ] Red Flag Detail: **get** alert, **update** status; optionally **add** to `alerts/{id}/actions`.
- [ ] Replace all remaining mock data; add loading and error states; handle offline/retry if needed.

### 11.3 Security Rules and testing
- [ ] Review and test **Firestore Rules** for every collection: mothers can only read/write their own data where specified; staff can only read/write data for their facility. Use the Rules Playground or a test script.
- [ ] Review **Storage Rules** for `users/{uid}/**` so only the owner (and optionally staff for patient photos) can access.
- [ ] Document how to run the Flutter and TSA apps against the same Firebase project (e.g. dev vs prod project); smoke-test auth, profile, check-in, alert creation, and TSA views.

---

## Quick reference: Firestore collections & auth

| Collection / Area   | Purpose | Who creates | Who reads |
|---------------------|--------|-------------|-----------|
| **Auth**            | Mothers & staff sign up / sign in | App (Flutter / React) | — |
| **users**           | Mother profile (incl. linkedFacilityId, photo) | App on first signup (or CF) | Owner (mobile); Staff by facility (TSA) |
| **staff**           | Staff profile (facilityId, role) | Admin / CF | Staff self (TSA) |
| **facilities**      | Hospitals/clinics list | Seed / script / CF | Authenticated (mobile search); Staff |
| **checkIns**        | Symptom logs | Mobile | Mother; Staff by facility |
| **ppdScreenings**   | EPDS results | Mobile | Mother; Staff by facility |
| **alerts**          | Red flags | Mobile (or CF on check-in/PPD) | Staff by facility; Mother (own only if you allow) |
| **meals**           | Meal logs + imageUrl | Mobile | Mother; Staff by facility |
| **clinicalNotes**   | Staff notes per patient | TSA | Staff by facility |
| **referrals**       | (Optional) Referral requests | TSA | Staff by facility |

---

## Optional: Cloud Functions (Node.js)

Use if you want server-side logic without a separate backend:

- [ ] **On user create:** Create `users/{uid}` or `staff/{uid}` with default fields and role.
- [ ] **On check-in / PPD create:** If criteria met, create `alerts` document (single place for red-flag logic).
- [ ] **On alert create:** Send FCM or email to facility (e.g. topic or token per facility).
- [ ] **Aggregations:** Periodically write dashboard counts or nutrition summary to a collection for fast TSA reads.

---

*Update this checklist as you complete items or adjust scope. Keep it in version control with the rest of the project.*
