# Changelog — Catalina 445 VoyageMaker

## v1.0.0 — 2026-05-17 (Initial Release)

### Inventory Management
- 23 numbered compartments matching the real Catalina 445 floor plan
- Interactive boat diagram with clickable compartment circles
- Item count badges on compartment circles (stocked vs. empty state)
- Add, remove, set quantity, and delete items per compartment
- Find item across all compartments by name

### Voice Commands (requires HTTPS)
- Global mic button — no need to navigate to a compartment first
- Supported commands:
  - `add 6 cans of beans` — adds 6 beans to best-matched compartment
  - `add engine oil to compartment 23` — targets specific compartment
  - `remove 3 flares` — removes from wherever flares are found
  - `check flares` / `how many flares` — reports location and quantity
  - `start voyage to Newport` — starts a new voyage log
  - `end voyage` — closes the active voyage
  - `log calm seas, 10 knots` — adds a text note to active voyage
- Strips filler words: "let's", "please", "can you", "hey", "ok", "okay"
- Tries up to 3 speech recognition alternatives before giving up

### Voyage Log
- Start, end, continue (resume), and rename voyages
- Log entries with: GPS coordinates (DDM format), COG, SOG, AWA, AWS, notes
- GPS button auto-fills current position from device
- Edit log entry text inline after the fact
- Log entries grouped by date with gold date separators
- Export any voyage to a formatted PDF (A4, dark header, nav data in monospace)
- Past voyages toolbar: Continue / Edit Name / Export PDF

### Cross-Device Sync
- Firebase Firestore real-time sync between iPhone and iPad
- 6-character Boat Code pairing — enter code on second device to join
- DEVICE_ID pattern prevents sync loops between devices
- Debounced writes (1.5s) to avoid excessive Firestore usage
- Offline warning: "Offline — Update via one device only"
- All data persisted to localStorage for full offline operation

### PWA / Offline
- Works fully offline via localStorage
- Installable via Safari → Share → Add to Home Screen
- HTTPS required for voice (use Netlify URL, not local IP)

### UI / Layout
- Navy/brass sailing aesthetic
- NavBar fixed to top: "Ship's Stores" | "Voyage Log"
- Responsive: two-column layout on iPad, scrollable on iPhone
- Brass indicator bar on active nav tab

### Infrastructure
- React 19 + Vite 8
- Firebase Firestore v10 with persistent local cache
- Deployed to Netlify (auto-deploy from GitHub main branch)
- Firebase project: c445-voyagemaker
