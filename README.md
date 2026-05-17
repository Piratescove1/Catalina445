# Catalina 445 VoyageMaker

A mobile-first PWA for Catalina 445 sailboat owners. Manage ship's stores across all 23 compartments and keep a detailed voyage log — works offline, syncs between iPhone and iPad via Firebase.

**Live app:** https://strong-medovik-7dc336.netlify.app

---

## User Guide

### Installing on iPhone / iPad

1. Open the URL above in **Safari**
2. Tap the **Share** button → **Add to Home Screen**
3. Tap **Add** — the app icon appears on your home screen
4. Launch it like any app — runs fullscreen, works offline

### Ship's Stores (Inventory)

- Tap any **numbered circle** on the boat diagram to open that compartment
- Or tap a compartment row in the list below the diagram
- In the compartment panel:
  - Type an item name, quantity, and optional unit → **Add**
  - Tap **+** / **−** to adjust quantity
  - Tap the quantity number to type an exact amount
  - Tap **Delete** to remove an item entirely

### Voice Commands

Tap the **mic button** (top of inventory screen). Speak clearly after it turns red. Supported commands:

| What you say | What happens |
|---|---|
| `add 6 cans of beans` | Adds 6 beans to a general compartment |
| `add engine oil to compartment 23` | Adds to compartment 23 specifically |
| `remove 3 flares` | Removes 3 flares from wherever they are |
| `check flares` | Reports which compartment flares are in |
| `start voyage to Newport` | Starts a new voyage |
| `end voyage` | Closes the active voyage |
| `log calm seas` | Adds a text note to the active voyage |

You can prefix any command with "let's", "please", "hey", "ok" and it still works.

Voice requires **HTTPS** — use the Netlify URL, not a local network address.

### Voyage Log

1. Tap **Voyage Log** in the top nav bar
2. Enter a voyage name → **Start Voyage**
3. Tap **+ Add Entry** to log:
   - Tap **GPS** to auto-fill your current position
   - Fill in COG (course over ground), SOG (speed over ground)
   - AWA (apparent wind angle), AWS (apparent wind speed)
   - Notes (free text)
   - Tap **Add Entry**
4. Tap **End Voyage** when done
5. Past voyages appear below — tap to expand:
   - **Continue** — reopens the voyage as active
   - **Edit Name** — renames the voyage
   - **Export PDF** — downloads a formatted A4 log

### Device Sync

1. Tap the sync bar at the top (shows Synced / Offline)
2. Your **Boat Code** is displayed (6 uppercase letters)
3. On a second device, open the app → tap the sync bar → enter the Boat Code → **Join**
4. Both devices now share all inventory and voyage data in real time

> **Offline note:** If you lose internet, changes save locally. When connectivity returns, the last device to reconnect pushes its data. Avoid editing on two devices simultaneously while offline — last write wins.

---

## Developer Guide

### Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 8 (Rolldown bundler) |
| Styling | Plain CSS (`src/index.css`) |
| Data / State | React useState + localStorage |
| Sync | Firebase Firestore v10 |
| Voice | Web Speech API (webkitSpeechRecognition) |
| PDF Export | jsPDF |
| Hosting | Netlify (auto-deploy from GitHub) |
| Local HTTPS | @vitejs/plugin-basic-ssl |

### Project Structure

```
src/
  App.jsx                  Root component — wires inventory, voyages, sync, nav
  main.jsx                 React entry point
  index.css                All styles (navy/brass sailing theme)

  data/
    compartments.js        23 compartment definitions (id, name, icon, SVG coords)

  lib/
    firebase.js            Firebase init with persistentLocalCache

  hooks/
    useInventory.js        All inventory + voyage state, localStorage persistence
    useSync.js             Firestore real-time sync, Boat Code, DEVICE_ID loop guard
    useVoice.js            Speech recognition + command parser

  components/
    BoatDiagram.jsx        Interactive floor plan with ResizeObserver scaling
    CompartmentModal.jsx   Item list + add/remove panel for one compartment
    NavBar.jsx             Top nav bar — Ship's Stores | Voyage Log
    VoiceButton.jsx        Mic button with listening state

  screens/
    InventoryScreen.jsx    Boat diagram + voice button + compartment panel
    VoyageScreen.jsx       Voyage list, active voyage form, log entries

  utils/
    exportVoyagePDF.js     jsPDF voyage log export (A4, dark header)
```

### Key Data Structures

**Inventory** (localStorage key: `c445-inventory`)
```js
{
  "comp-1": [{ name: "flares", qty: 3, unit: "box", addedAt: 1700000000000 }],
  "comp-23": [{ name: "engine oil", qty: 2, unit: "L", addedAt: 1700000000001 }],
  // one key per compartment id
}
```

**Voyages** (localStorage key: `c445-voyages`)
```js
[{
  id: 1700000000000,
  name: "Newport Run",
  destination: "Newport Run",  // legacy alias, same value as name
  startTime: "2026-05-17T...",
  endTime: "2026-05-17T...",   // null if active
  status: "active" | "completed",
  notes: [{
    time: "2026-05-17T...",
    text: "Calm seas",
    lat: "41°22.34'N",   // DDM format, optional
    lon: "071°17.89'W",  // optional
    cog: "245",          // optional
    sog: "6.2",          // optional
    awa: "35",           // optional
    aws: "14",           // optional
  }]
}]
```

**Firestore document** (collection: `boats`, document ID = Boat Code)
```js
{
  inventory: { ...same structure as localStorage },
  voyages:   [ ...same structure as localStorage ],
  deviceId:  "abc123",        // DEVICE_ID of last writer — used to ignore own updates
  updatedAt: 1700000000000
}
```

### Local Development

```bash
cd catalina445
npm install
npm run dev        # starts HTTPS dev server with self-signed cert
```

Accept the browser certificate warning. Voice commands require HTTPS — the local dev server handles this via @vitejs/plugin-basic-ssl.

To test on a phone/iPad on the same WiFi network, navigate to the IP shown in the terminal (e.g. `https://192.168.1.x:5173`) and accept the cert warning.

### Environment Variables

Create `.env` in the project root (never commit this file):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

For production, these are set in Netlify → Project configuration → Environment variables.

### Deploying

Push to `main` on GitHub — Netlify auto-deploys within ~30 seconds.

```bash
git add -A
git commit -m "your message"
git push
```

### Firebase Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boats/{boatId} {
      allow read, write: if true;
    }
  }
}
```

Open access — fine for a private boat group. Add Firebase Authentication if distributing publicly.

### Vite / Rolldown Note

Vite 8 uses the Rolldown bundler. Firebase v10 requires `resolve.conditions: ['browser', ...]` in `vite.config.js` to resolve its subpath exports correctly. Do not remove this — without it the production build fails.

### Known Limitations

- **Last-write-wins sync:** Two devices editing offline simultaneously will lose one set of changes on reconnect.
- **Voice on Android:** Works on Chrome only (uses `webkitSpeechRecognition`), not Firefox.
- **iOS voice:** Requires HTTPS. Local dev works; plain `http://` does not.
- **Bundle size:** jsPDF + pdfjs produce ~900 kB. Vite warns about this but it does not affect function.
