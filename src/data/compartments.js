// Default compartment template (Catalina 445). Users can edit/add/remove these;
// the effective list lives in CompartmentsContext (persisted per boat).
// px/py = marker position as a percentage of the boat-plan image (custom boats
// set their own via the map editor). num is a display number.

export const DEFAULT_COMPARTMENTS = [
  { num: 1,  id: 'comp-1',  name: 'Under V-berth FWD',            icon: '⚓',  px: 79.2, py: 52.4 },
  { num: 2,  id: 'comp-2',  name: 'Under V-berth AFT',            icon: '⚓',  px: 70.7, py: 52.0 },
  { num: 3,  id: 'comp-3',  name: 'Fwd Stbd Sole Port',           icon: '📦', px: 68.1, py: 47.5 },
  { num: 4,  id: 'comp-4',  name: 'Fwd Stbd Sole Starboard',      icon: '📦', px: 68.1, py: 57.6 },
  { num: 5,  id: 'comp-5',  name: 'Port Salon Settee Top',        icon: '🛋️', px: 56.3, py: 23.6 },
  { num: 6,  id: 'comp-6',  name: 'Port Salon Settee Under Port', icon: '🛋️', px: 56.5, py: 34.8 },
  { num: 7,  id: 'comp-7',  name: 'Port Salon Settee Under Stbd', icon: '🛋️', px: 56.7, py: 45.5 },
  { num: 8,  id: 'comp-8',  name: 'Stbd Salon Settee FWD Upper',  icon: '🛋️', px: 58.2, py: 80.0 },
  { num: 9,  id: 'comp-9',  name: 'Port Salon Settee Top Middle', icon: '🛋️', px: 51.9, py: 23.5 },
  { num: 10, id: 'comp-10', name: 'Port Salon Settee Middle',     icon: '🛋️', px: 51.9, py: 32.3 },
  { num: 11, id: 'comp-11', name: 'Stbd Salon Settee Aft Upper',  icon: '🛋️', px: 50.0, py: 83.4 },
  { num: 12, id: 'comp-12', name: 'Stbd Salon Settee Aft',        icon: '🛋️', px: 48.4, py: 23.5 },
  { num: 13, id: 'comp-13', name: 'Port Salon Aft Settee Port',   icon: '🛋️', px: 48.2, py: 34.8 },
  { num: 14, id: 'comp-14', name: 'Port Salon Aft Settee Stbd',   icon: '🛋️', px: 48.0, py: 46.4 },
  { num: 15, id: 'comp-15', name: 'Deep Freeze',                  icon: '🧊', px: 44.1, py: 26.7 },
  { num: 16, id: 'comp-16', name: 'Under Galley Sink',            icon: '🍳', px: 44.1, py: 37.2 },
  { num: 17, id: 'comp-17', name: 'Chart Table / Nav Station',    icon: '🗺️', px: 42.7, py: 62.8 },
  { num: 18, id: 'comp-18', name: 'Galley Under Sole',            icon: '🍳', px: 38.1, py: 38.1 },
  { num: 19, id: 'comp-19', name: 'Under Companionway Stairs',    icon: '📦', px: 36.9, py: 53.2 },
  { num: 20, id: 'comp-20', name: 'Flex Under Berth',             icon: '📦', px: 27.6, py: 37.3 },
  { num: 21, id: 'comp-21', name: 'Guest Cabin',                  icon: '🛏️', px: 19.7, py: 52.9 },
  { num: 22, id: 'comp-22', name: 'Stern Starboard Locker',       icon: '🔧', px: 11.3, py: 37.4 },
  { num: 23, id: 'comp-23', name: 'Stern Port Locker',            icon: '🔧', px: 11.4, py: 67.2 },
  { num: 24, id: 'comp-24', name: 'Aft Starboard Quarter',        icon: '📦', px:  6.6, py: 37.4 },
  { num: 25, id: 'comp-25', name: 'Aft Port Quarter',             icon: '📦', px:  6.8, py: 66.9 },
]

// Backwards-compatible alias.
export const COMPARTMENTS = DEFAULT_COMPARTMENTS

export const COMPARTMENT_ICONS = ['📦', '⚓', '🛋️', '🧊', '🍳', '🗺️', '🛏️', '🔧', '🧰', '🚿', '🔌', '🧯', '💊', '🍷', '🥫', '🎣']

export function newCompartmentId() {
  return 'comp-' + Math.random().toString(36).slice(2, 9)
}

// An "area" is a tab: a named group of compartments with an optional uploaded
// diagram (image). The default area shows the built-in Catalina 445 plan.
export const DEFAULT_AREA_ID = 'area-main'
export const DEFAULT_AREAS = [
  { id: DEFAULT_AREA_ID, name: 'Compartments', image: null, builtinImage: '/boat-plan.png' },
]

export function newAreaId() {
  return 'area-' + Math.random().toString(36).slice(2, 9)
}

