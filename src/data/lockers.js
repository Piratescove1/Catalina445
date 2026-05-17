// Catalina 445 — Drawers and Lockers (23 positions)
// bow = right, stern = left, starboard = top, port = bottom

export const LOCKERS = [
  // ── Forward Cabin ──────────────────────────────────────
  { id: 'lock-1',  num: 1,  area: 'Forward Cabin',   name: 'Fwd Cabin Under Berth Drawer to Port',          icon: '🗄️' },
  { id: 'lock-2',  num: 2,  area: 'Forward Cabin',   name: 'Fwd Cabin Under Berth Drawer to Starboard',     icon: '🗄️' },
  { id: 'lock-3',  num: 3,  area: 'Forward Cabin',   name: 'Fwd Cabin Port Under Settee to Port',           icon: '🛋️' },
  { id: 'lock-4',  num: 4,  area: 'Forward Cabin',   name: 'Fwd Cabin Starboard Under Settee to Starboard', icon: '🛋️' },
  { id: 'lock-5',  num: 5,  area: 'Forward Cabin',   name: 'Fwd Cabin Starboard Locker Fwd',                icon: '📦' },
  { id: 'lock-6',  num: 6,  area: 'Forward Cabin',   name: 'Fwd Cabin Starboard Hanging Locker',            icon: '👔' },
  // ── Head ───────────────────────────────────────────────
  { id: 'lock-7',  num: 7,  area: 'Head',            name: 'Fwd Head Under Sink',                           icon: '🚿' },
  // ── Salon Starboard ────────────────────────────────────
  { id: 'lock-8',  num: 8,  area: 'Salon Starboard', name: 'Salon Starboard FWD Top Drawer',                icon: '🗄️' },
  { id: 'lock-9',  num: 9,  area: 'Salon Starboard', name: 'Salon Starboard FWD Middle Drawer',             icon: '🗄️' },
  { id: 'lock-10', num: 10, area: 'Salon Starboard', name: 'Salon Starboard FWD Lower Drawer',              icon: '🗄️' },
  { id: 'lock-11', num: 11, area: 'Salon Starboard', name: 'Salon Starboard Under Settee Drawer',           icon: '🗄️' },
  { id: 'lock-12', num: 12, area: 'Salon Starboard', name: 'Salon Starboard Fwd Upper Cabinet',             icon: '📦' },
  { id: 'lock-14', num: 14, area: 'Salon Starboard', name: 'Salon Starboard Under Settee Drawer (Aft)',     icon: '🗄️' },
  // ── Salon Port ─────────────────────────────────────────
  { id: 'lock-13', num: 13, area: 'Salon Port',      name: 'Salon Port Fwd Upper Cabinet',                  icon: '📦' },
  { id: 'lock-15', num: 15, area: 'Salon Port',      name: 'Salon Port Aft Upper Cabinet',                  icon: '📦' },
  // ── Galley ─────────────────────────────────────────────
  { id: 'lock-16', num: 16, area: 'Galley',          name: 'Galley Under Sink',                             icon: '🍳' },
  // ── Nav Station ────────────────────────────────────────
  { id: 'lock-17', num: 17, area: 'Nav Station',     name: 'Nav Station Top Drawer',                        icon: '🗺️' },
  { id: 'lock-18', num: 18, area: 'Nav Station',     name: 'Nav Station Bottom Drawer',                     icon: '🗺️' },
  // ── Day Head ───────────────────────────────────────────
  { id: 'lock-19', num: 19, area: 'Day Head',        name: 'Day Head Under Sink',                           icon: '🚿' },
  // ── Flex Cabin ─────────────────────────────────────────
  { id: 'lock-20', num: 20, area: 'Flex Cabin',      name: 'Flex Hanging Locker',                           icon: '👔' },
  { id: 'lock-22', num: 22, area: 'Flex Cabin',      name: 'Flex Aft Compartment (Fwd)',                    icon: '📦' },
  { id: 'lock-23', num: 23, area: 'Flex Cabin',      name: 'Flex Aft Compartment (Aft)',                    icon: '📦' },
  // ── VIP Cabin ──────────────────────────────────────────
  { id: 'lock-21', num: 21, area: 'VIP Cabin',       name: 'VIP Hanging Locker',                            icon: '👔' },
]

export const LOCKER_AREAS = [
  'Forward Cabin',
  'Head',
  'Salon Starboard',
  'Salon Port',
  'Galley',
  'Nav Station',
  'Day Head',
  'Flex Cabin',
  'VIP Cabin',
]
