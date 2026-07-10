# Catalina 445 App — Engineering Handoff

> Purpose: give any developer or AI assistant enough context to continue this
> project confidently. Read this top-to-bottom before making changes.

## 1. What this is
A **React + Vite web app (PWA)** for managing a Catalina 445 sailboat: ship's
stores inventory, voyage log + GPS, maintenance log, provisioning lists, and a
ditch-bag (abandon-ship) checklist. It is **offline-first** (must work offshore
with no connectivity) and syncs across devices via Firebase when online.

- **Live URL:** https://strong-medovik-7dc336.netlify.app
- **Repo:** github.com/Piratescove1/catalina445 (redirects to `Catalina445`)
- **Local path (author's machine):** `C:\Users\pross\Documents\catalina445`

> ⚠️ There is a SEPARATE, unrelated prototype at
> `C:\Users\pross\Documents\Codex\2026-05-10\i-d-like-to-make-an` (an Expo/
> React-Native app, package `catalina-445-inventory`). It is NOT this app.
> Ignore it.

## 2. Tech stack
- React 18 + Vite (`vite build`), plain JS/JSX (no TypeScript).
- Firebase (Firestore) for cloud sync. SDK v10.
- WebCrypto (SubtleCrypto) for encryption; WebAuthn (PRF) for biometrics.
- Service worker (`public/sw.js`) for offline + update handling.
- ESLint configured but NOT run in CI; there are known pre-existing lint
  warnings (unused destructured props in `useSync`, a `lastDay` reassignment in
  `VoyageScreen`). They do not block the build.

## 3. Deploy pipeline
`git push origin main` → Netlify auto-builds (`vite build`) → deploys to the live
URL. **Local edits do not appear until pushed.** No `netlify.toml`; Netlify uses
defaults. Commits are authored as `Pete Ross <pross@rossvideo.com>` (machine git
identity). Line-ending warnings (LF→CRLF) on commit are harmless.

The service worker is **network-first for the HTML shell** and cache-first for
hashed assets, and its cache name is stamped with a unique per-build id by a Vite
plugin (`stampServiceWorker` in `vite.config.js`, replaces `__BUILD_ID__` in
`sw.js`). Result: a normal reload always gets the latest deploy. **Never tell a
user to "Clear Website Data"** — that wipes localStorage (see §5) and looks like
data loss.

## 4. Firebase
- Project: **`c445-voyagemaker`**, owned by Google account
  **peterross10@gmail.com**.
- Config comes from `.env` (`VITE_FIREBASE_*`, inlined at build). Init in
  `src/lib/firebase.js` with `persistentLocalCache`.
- Firestore layout: `boats/{boatId}` holds one doc per boat; encrypted/plaintext
  payload + `deviceId` + `updatedAt` (+ `enc`/`v` when encrypted). Auto history
  snapshots at `boats/{boatId}/history/{autoId}`.
- Security rules live at repo root `firestore.rules` (published via console):
  `boats/{id}` allows get + create/update/delete, **`list: false`** (blocks
  enumeration), history read/write allowed, everything else denied.
- Read-only inspection: parse `.env`, `initializeApp`, `getDoc(doc(db,'boats',
  <CODE>))`. NOTE: listing the whole `boats` collection now fails under the
  rules; `getDoc` by exact id still works.

## 5. Data model & storage
All user data lives in **localStorage** (mirrored to Firestore when online).
Never in code. The 12 data keys (see `DATA_KEYS` in `src/lib/vault.js`):

```
c445-inventory  c445-voyages  c445-locker-inventory  c445-provisions
c445-prov-categories  c445-maintenance  c445-future-projects
c445-ditch-sop  c445-ditch-items  c445-prefs  c445-labels  c445-boat-id
```

Auth/crypto keys in localStorage: `c445-accounts` (account records),
`c445-vault` (encrypted data blob), `c445-biometric` (passkey config),
`c445-last-user`.

The current author's boat code is **`G3RJC6`** (the only non-empty cloud doc;
~19 other docs are throwaway test codes). Local data backups are saved as
`boats-*-backup.json` / `backup-*.json` and are **git-ignored** (contain real
data — never commit).

## 6. Auth & encryption (Phase 1 — DONE)
Local-first identity so login works fully offline. Envelope encryption:

- `src/lib/crypto.js` — WebCrypto primitives. Password → **KEK** via PBKDF2
  (SHA-256, 210k iters). A random per-boat **DEK** (AES-GCM-256) encrypts data.
  The DEK is wrapped by the KEK (`wrapDEK`/`unwrapDEK`) — login = unwrap locally
  (throws on wrong password). `encryptJSON`/`decryptJSON` for data.
  `generateRecoveryCode` (grouped, unambiguous alphabet). Unit-tested.
- `src/lib/vault.js` — `c445-accounts` records `{username, salt, iterations,
  wrappedDEK, recovery:{salt,wrappedDEK}, ...}`. `createFirstAccount` generates a
  DEK and captures existing plaintext into the vault (migration). `login`,
  `recover` (recovery-code copy of the DEK), `resetPassword` (re-wrap + new
  code). `openVault(dek)` decrypts `c445-vault` and writes the 12 plaintext keys
  back to localStorage; `writeVault(dek)` re-encrypts; `clearLocalData()` wipes
  the plaintext keys. Existing hooks read plaintext localStorage unchanged.
- `src/context/AuthContext.jsx` — holds `status` (locked/unlocked), `account`,
  the DEK **in memory only** (`dekRef`), and flags for recovery/reset. Exposes
  signup/login/recover/submitReset/confirmRecovery, persist (called on every data
  change), logout, biometric methods, and `encryptData`/`decryptData` (for cloud
  sync). On mount, if accounts exist it wipes plaintext (locked at rest); on
  `beforeunload` it wipes plaintext (only ciphertext remains when closed).
- `src/components/AuthScreen.jsx` — signup (first run) / login / forgot-password
  (recovery code) / forced password reset / one-time recovery-code display, plus
  the "Unlock with Face ID" button.
- `src/main.jsx` — wraps `<App/>` in `<AuthProvider>` and a `Gate` that renders
  `App` only when unlocked, else `AuthScreen`.

Flow: first run → signup (migrates existing data) → shows recovery code → app.
Later opens → login (password or Face ID) → `openVault` hydrates localStorage →
app. Close → plaintext wiped, vault + accounts remain.

## 7. Biometrics (Phase 1b — DONE)
`src/lib/biometric.js` — Face ID / fingerprint via **WebAuthn PRF**. Enroll
creates a platform passkey; its PRF output wraps the DEK (secret never stored).
Unlock = passkey assertion → PRF → unwrap DEK. If the device can't do PRF it
**refuses to enroll** (no insecure fallback); password always works. Enable/
disable in Settings; button appears on the login screen once enrolled.
**Only testable on a real device.**

## 8. Cloud sync (`src/hooks/useSync.js`)
- Boat identified by `c445-boat-id`; all devices with the same code share
  `boats/{id}`. Random `DEVICE_ID` per load; snapshots with our own deviceId are
  ignored (echo prevention).
- Writes debounced 1.5s. **Hydration gate**: never push until the first server
  snapshot arrives (prevents a fresh/empty device from clobbering the cloud);
  guards re-checked when the debounced push fires.
- Offline: changes queued in `pendingData`; on reconnect a dialog asks keep-local
  vs restore-server (`resolveSync`).
- **Auto cloud history**: every push also writes a throttled snapshot (≤ every
  10 min, keep last 20) to `boats/{id}/history`. Settings → "Cloud Backups"
  lists/restores them. Also JSON export/restore + Excel export in Settings.
- **`CLOUD_ENCRYPTION` flag (currently `false`) — IMPORTANT.** `toCloud`/
  `fromCloud` encrypt/decrypt the payload with the DEK. Phase 2a turned this on,
  but it broke multi-device sync because each device has its **own** DEK (Phase 3
  not built) — a 2nd device couldn't decrypt. So the flag is **off**: cloud
  writes plaintext; reads still decrypt legacy-encrypted docs and the snapshot
  handler converts the stored doc to the current mode on load. **Re-enable (set
  `true`) only after Phase 3 shares one boat key across devices.** Local at-rest
  vault encryption is unaffected either way.

## 9. Roadmap & status
- ✅ Phase 1 — offline login + on-device encryption (commit 5f4b3bf)
- ✅ Phase 1b — Face ID / fingerprint unlock (commit 33dc97c)
- ⏸️ Phase 2a — cloud E2E encryption: built (9b8eefd), then **disabled** via
  `CLOUD_ENCRYPTION=false` (2bd79a5) pending Phase 3
- ✅ Phase 2b — locked Firestore rules (no enumeration); `firestore.rules`
- ⛔ Phase 3 (NEXT, required to re-enable cloud encryption + proper multi-device):
  device-to-device key handoff so all devices/accounts share ONE boat DEK. Design
  locked in: QR for the small secret/keys + **AirDrop or the boat's hotspot** for
  the data (works with zero connectivity). Individual per-crew logins all mapping
  to the same boat DEK.
- 📋 Phase 4 — Licensing via **Stripe** (decided over App Store). Terms 1mo/6mo/
  1yr, **per-boat** (owner pays, crew covered), **buy-a-term** (not auto-renew),
  **soft lapse** (never hard-lock safety data offshore; disable sync/premium +
  nag). Flow: in-app Upgrade → Stripe Checkout (carry boatId+email) → a
  **Netlify Function** webhook writes "paid until [date]" to Firebase → app
  caches expiry locally and checks it offline. Real enforcement is server-side on
  cloud sync/backup; client checks are best-effort (web code is readable).

## 10. Build / test / verify
- `npm run dev` — local dev (https via basic-ssl). `npm run build` — production.
- Crypto/vault logic is unit-testable in Node with a `localStorage` shim and
  `globalThis.crypto` (see git history for the test harnesses used). Extensionful
  imports required in Node (`./crypto.js`).
- After deploy, confirm live by fetching the JS bundle / `sw.js` cache id.
- Cloud state: read-only `getDoc` script parsing `.env` (see §4).

## 11. Gotchas (read before editing)
- **Never** advise "Clear Website Data" — wipes localStorage (all data + the boat
  code) → looks like total loss. Use a normal reload (SW is network-first).
- **`CLOUD_ENCRYPTION` is off** on purpose — see §8. Don't re-enable without
  Phase 3.
- Each device currently has its **own** DEK; sharing keys is Phase 3.
- Security honesty: it's a web app (code is readable client-side). Confidentiality
  comes from encryption; there is no server-side login (offline requirement), so
  rules can't fully restrict per-boat writes without Phase 3-style secrets.
- Backups (`boats-*-backup.json`, `backup-*.json`) are git-ignored — keep it that
  way (real user data).
