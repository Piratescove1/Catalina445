/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { PER_BOAT_KEYS, newBoatId } from '../data/boats'
import { newAreaId } from '../data/compartments'

// A fresh boat starts blank: one empty area (no drawing) and no compartments,
// so it prompts the user to upload its own drawing rather than showing the
// built-in Catalina plan.
function blankBoatSeed() {
  return {
    'c445-areas': JSON.stringify([{ id: newAreaId(), name: 'Compartments', image: null }]),
    'c445-compartments': JSON.stringify([]),
  }
}

const BOATS_KEY = 'c445-boats'      // [{ id, name }]
const ACTIVE_KEY = 'c445-boat-id'   // active boat id
const PARK_KEY = 'c445-boatdata'    // { [boatId]: { <per-boat key>: value } } for inactive boats

const Ctx = createContext(null)
export const useBoats = () => useContext(Ctx)

function loadJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function readFlat() {
  const o = {}
  for (const k of PER_BOAT_KEYS) { const v = localStorage.getItem(k); if (v != null) o[k] = v }
  return o
}
function writeFlat(obj) {
  for (const k of PER_BOAT_KEYS) {
    if (obj && obj[k] != null) localStorage.setItem(k, obj[k])
    else localStorage.removeItem(k)
  }
}

export function BoatsProvider({ children }) {
  const [boats, setBoats] = useState(() => {
    let list = loadJSON(BOATS_KEY, null)
    if (!Array.isArray(list) || list.length === 0) {
      // Migrate: the existing single boat becomes the first boat.
      let id = localStorage.getItem(ACTIVE_KEY)
      if (!id) { id = newBoatId(); localStorage.setItem(ACTIVE_KEY, id) }
      let name = 'My Boat'
      try { const p = loadJSON('c445-prefs', {}); if (p?.boatName) name = p.boatName } catch { /* ignore */ }
      list = [{ id, name }]
      localStorage.setItem(BOATS_KEY, JSON.stringify(list))
    }
    return list
  })
  const [activeBoatId, setActiveId] = useState(() => localStorage.getItem(ACTIVE_KEY) || boats[0]?.id)

  const saveBoats = useCallback((list) => {
    setBoats(list)
    try { localStorage.setItem(BOATS_KEY, JSON.stringify(list)) } catch { /* ignore */ }
  }, [])

  // Park the active boat's data and load `loadData` (or the target boat's parked
  // data when loadData is omitted).
  const parkAndLoad = useCallback((toId, loadData) => {
    const park = loadJSON(PARK_KEY, {})
    park[activeBoatId] = readFlat()                         // save current
    writeFlat(loadData !== undefined ? loadData : (park[toId] || {}))
    delete park[toId]
    try { localStorage.setItem(PARK_KEY, JSON.stringify(park)) } catch { /* ignore */ }
    localStorage.setItem(ACTIVE_KEY, toId)
    setActiveId(toId) // remounts the app subtree (keyed on activeBoatId)
  }, [activeBoatId])

  const switchBoat = useCallback((id) => {
    if (id && id !== activeBoatId) parkAndLoad(id)
  }, [activeBoatId, parkAndLoad])

  const addBoat = useCallback((name) => {
    const id = newBoatId()
    // lockers:false — new/custom boats don't get the Catalina-specific
    // "Lockers & Drawers" tab; they use their own areas instead.
    saveBoats([...boats, { id, name: (name || '').trim() || 'New boat', lockers: false }])
    parkAndLoad(id, blankBoatSeed()) // start the new boat blank
    return id
  }, [boats, saveBoats, parkAndLoad])

  const renameBoat = useCallback((id, name) => {
    saveBoats(boats.map(b => (b.id === id ? { ...b, name } : b)))
  }, [boats, saveBoats])

  const deleteBoat = useCallback((id) => {
    if (boats.length <= 1) return
    const remaining = boats.filter(b => b.id !== id)
    saveBoats(remaining)
    const park = loadJSON(PARK_KEY, {})
    delete park[id]
    if (id === activeBoatId) {
      const toId = remaining[0].id
      writeFlat(park[toId] || {}) // load a remaining boat; discard the deleted boat's flat data
      delete park[toId]
      try { localStorage.setItem(PARK_KEY, JSON.stringify(park)) } catch { /* ignore */ }
      localStorage.setItem(ACTIVE_KEY, toId)
      setActiveId(toId)
    } else {
      try { localStorage.setItem(PARK_KEY, JSON.stringify(park)) } catch { /* ignore */ }
    }
  }, [boats, activeBoatId, saveBoats])

  const activeBoat = boats.find(b => b.id === activeBoatId) || boats[0]

  const value = { boats, activeBoatId, activeBoat, switchBoat, addBoat, renameBoat, deleteBoat }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
