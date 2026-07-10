# Project context for AI assistants

**Read [HANDOFF.md](./HANDOFF.md) first — it is the source of truth** for this
codebase (architecture, data model, auth/encryption, sync, roadmap, and
critical gotchas).

Quick reminders:
- Offline-first PWA; deploy via `git push origin main` → Netlify.
- All user data is in localStorage + Firestore `boats/{boatId}`; never in code.
- `CLOUD_ENCRYPTION` in `src/hooks/useSync.js` is intentionally `false` (see
  HANDOFF §8) — do not re-enable before Phase 3.
- Never instruct users to "Clear Website Data" (wipes their data).
