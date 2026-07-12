// Multi-boat support. Each boat has its own copy of these PER-BOAT localStorage
// keys; switching boats parks the current set and loads the selected boat's.
// Provisioning (c445-provisions, c445-prov-categories) is intentionally NOT in
// this list — it's shared across all of a user's boats.
export const PER_BOAT_KEYS = [
  'c445-inventory',
  'c445-voyages',
  'c445-compartments',
  'c445-areas',
  'c445-maintenance',
  'c445-future-projects',
  'c445-ditch-sop',
  'c445-ditch-items',
  'c445-locker-inventory',
  'c445-labels',
  'c445-prefs',
]

export function newBoatId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
