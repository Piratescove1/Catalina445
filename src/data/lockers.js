// Catalina 445 — Drawers and Lockers
// 20 locations (diagram labels 1-19 but uses "18" twice)
// area groups are used for the list view section headers

export const LOCKERS = [
  { id: 'lock-1',  num: 1,  area: 'Forward Cabin',     name: 'Fwd Stbd Locker',           icon: '🗄️' },
  { id: 'lock-2',  num: 2,  area: 'Forward Cabin',     name: 'Fwd Stbd Drawer',            icon: '🗄️' },
  { id: 'lock-3',  num: 3,  area: 'Forward Cabin',     name: 'Fwd Hanging Locker',         icon: '👔' },
  { id: 'lock-7',  num: 7,  area: 'Head',              name: 'Head Locker',                icon: '🚿' },
  { id: 'lock-13', num: 13, area: 'Galley',            name: 'Galley Fridge / Freezer',    icon: '🧊' },
  { id: 'lock-17', num: 17, area: 'Galley',            name: 'Galley Drawer (Stbd)',       icon: '🍳' },
  { id: 'lock-18', num: 18, area: 'Galley',            name: 'Galley Drawer (Port)',       icon: '🍳' },
  { id: 'lock-4',  num: 4,  area: 'Starboard Salon',   name: 'Stbd Fwd Salon Locker',     icon: '📦' },
  { id: 'lock-5',  num: 5,  area: 'Starboard Salon',   name: 'Stbd Salon Locker (Lower)', icon: '📦' },
  { id: 'lock-6',  num: 6,  area: 'Starboard Salon',   name: 'Stbd Salon Locker (Upper)', icon: '📦' },
  { id: 'lock-8',  num: 8,  area: 'Starboard Settee',  name: 'Stbd Settee (Upper)',       icon: '🛋️' },
  { id: 'lock-9',  num: 9,  area: 'Starboard Settee',  name: 'Stbd Settee (Middle)',      icon: '🛋️' },
  { id: 'lock-10', num: 10, area: 'Starboard Settee',  name: 'Stbd Settee (Lower)',       icon: '🛋️' },
  { id: 'lock-11', num: 11, area: 'Salon',             name: 'Salon Stbd Settee Aft',     icon: '🛋️' },
  { id: 'lock-12', num: 12, area: 'Salon',             name: 'Salon Port Settee',         icon: '🛋️' },
  { id: 'lock-14', num: 14, area: 'Companionway',      name: 'Port Salon Locker',         icon: '📦' },
  { id: 'lock-15', num: 15, area: 'Companionway',      name: 'Under Companionway Steps',  icon: '📦' },
  { id: 'lock-16', num: 16, area: 'Port Aft',          name: 'Port Aft Locker',           icon: '📦' },
  { id: 'lock-19', num: 19, area: 'Port Aft Cabin',    name: 'Aft Cabin Locker (Fwd)',    icon: '🛏️' },
  { id: 'lock-18b',num: '18★', area: 'Port Aft Cabin', name: 'Aft Cabin Locker (Aft)',   icon: '🛏️' },
]

export const LOCKER_AREAS = [
  'Forward Cabin',
  'Head',
  'Galley',
  'Starboard Salon',
  'Starboard Settee',
  'Salon',
  'Companionway',
  'Port Aft',
  'Port Aft Cabin',
]
