# Thryve

Thryve is a bi-directional mHealth system for postnatal care in Ghana. It links **mothers** to **healthcare facilities** in real time so facilities can see check-ins, EPDS (PPD) screenings, meal logs, and red-flag alerts, while staff document care in **clinical notes** and **referrals**.

The project addresses gaps in postnatal follow-up especially early detection of complications and postpartum depression by combining a **mobile app** for mothers with a **web dashboard** for hospital staff (TSA: Thryve System Analytics).

---

## Repository layout

| Path | Description |
|------|-------------|
| `thryve_mobile/` | **Mother’s app**  Flutter (Android-focused; iOS/macOS/Linux targets also present) |
| `tsa_web/` | **Staff dashboard** React + TypeScript + Vite + Tailwind CSS |
| `firestore.rules` | Firestore security rules |
| `storage.rules` | Firebase Storage security rules |
| `firestore.indexes.json` | Firestore composite indexes |
| `firebase.json` | Firebase deploy config (Firestore, Storage, Hosting) |
| `LICENSE` | MIT License |
| `BACKEND_CHECKLIST.md` | Backend / Firebase implementation checklist |
| `UNIT_TESTS.md`, `INTEGRATION_TESTS.md`, `SYSTEM_TESTS.md` | Manual test case outlines |
| `TEST_REPORT_TEMPLATE.md` | Template for recording test runs |

---

## Thryve Mobile (`thryve_mobile`)

### Role

Mothers sign in with **Firebase Auth**, complete **facility linkage**, manage **profile**, log **symptom check-ins**, complete **EPDS / PPD questionnaires** (with optional per-question notes and voice recording), and use **Smart Plate** to log **meals** (photo + ingredients + nutrients). Data is written to **Firestore** and **Firebase Storage** as configured in the app.

### Tech stack

- **Flutter** (Dart SDK ^3.11)
- **Firebase:** `firebase_core`, `firebase_auth`, `cloud_firestore`, `firebase_storage`
- **Audio:** `record` for EPDS voice notes
- **Maps / UI:** `flutter_map`, `image_picker`, etc.

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (stable channel)
- Android Studio or Xcode (for device emulators), or a physical device
- Firebase: Android app registered; `google-services.json` in `thryve_mobile/android/app/` (not committed if you use secrets—document locally)

### Run (development)

```bash
cd thryve_mobile
flutter pub get
flutter run
```

### Build release APK

```bash
cd thryve_mobile
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk` — distribute and install on Android devices (no Play Store required for internal testing).

### Tests

```bash
cd thryve_mobile
flutter test
```

---

## TSA Web (`tsa_web`)

### Role

**Staff** sign in with Firebase Auth. The app loads `staff/{uid}` for **facility context**, then provides:

- **Live Feed** — patients linked to the facility
- **Red-flag Alerts** & **Alert history**
- **Patient Details** — demographics, check-ins, EPDS summary, **link to full EPDS responses** (per-question answers, notes, audio), mood logs, **meal logs**, facility alerts, **clinical notes** (create + history), **referrals** to another facility
- **Full clinical track record** + **PDF export** (check-ins, EPDS, meals, timeline, referrals, notes)
- **Profile** — staff profile / sign-out

### Tech stack

- **React 18** + **TypeScript**
- **Vite 7**
- **Tailwind CSS 4**
- **Firebase** (Auth, Firestore, Storage URLs for assets/audio)
- **Leaflet** — maps where used
- **jsPDF** — patient track record PDF

### Prerequisites

- **Node.js** 20+ (or current LTS) and npm
- Firebase **Web app** config in `tsa_web` (e.g. `firebase.ts` / env) pointing at the same project as mobile

### Run (development)

```bash
cd tsa_web
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

### Build (production bundle)

```bash
cd tsa_web
npm install
npm run build
```

Output: `tsa_web/dist/`

### Automated tests (Vitest)

```bash
cd tsa_web
npm test
```

---

## Firebase (shared backend)

Both apps use the **same Firebase project**.

### Collections (high level)

| Collection | Used by |
|------------|---------|
| `users` | Mothers’ profiles; staff read patients at linked facility |
| `staff` | Staff profile + `facilityId` |
| `facilities` | Facility directory |
| `checkIns` | Symptom / severity logs |
| `ppdScreenings` | EPDS submissions (`answers`, `audioUrl` per item, etc.) |
| `alerts` | Red-flag queue |
| `moodLogs` | Mood entries |
| `meals` | Meal logs + `imageUrl` |
| `clinicalNotes` | Staff-only notes per patient |
| `patientReferrals` | Facility-to-facility referral audit log |

### Deploy rules & hosting

From the **repository root** (where `firebase.json` lives):

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only hosting
```

Hosting is configured to serve **`tsa_web/dist`** with SPA fallback to `index.html`.

Detailed backend steps: **`BACKEND_CHECKLIST.md`**.

---

## Design & media (references)

- **Figma:** https://www.figma.com/design/0x3eVfOzYTzqDmy4yiiBB6/Untitled?node-id=0-1&t=xA6btFXPMnsOIZlh-1
- **Figma walkthrough (Drive):** https://drive.google.com/drive/folders/1vcMV3EkcKF6X9ZW-gijzU6eCLTcFM7zt?usp=drive_link
- **Implementation video (Drive):** https://drive.google.com/drive/folders/11Q8AwsoNu76ijX3J_GPqw2SLyVQVuK1Q?usp=sharing

---

## Contributing / QA

- Follow existing patterns in each app; keep Firebase rules in sync with new reads/writes.
- Use **`UNIT_TESTS.md`**, **`INTEGRATION_TESTS.md`**, and **`SYSTEM_TESTS.md`** for structured manual QA; record outcomes in **`TEST_REPORT_TEMPLATE.md`**.
- Run **`npm test`** in `tsa_web` and **`flutter test`** in `thryve_mobile` before releases when applicable.

---

## License

This project is licensed under the [MIT License](LICENSE). Copyright Thryve **Nana Koramah Abeasi** (2026).


