/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import {
  DEFAULT_COMPARTMENTS, DEFAULT_AREAS, DEFAULT_AREA_ID, newCompartmentId, newAreaId,
} from '../data/compartments'

const COMP_KEY = 'c445-compartments'
const AREA_KEY = 'c445-areas'
const Ctx = createContext(null)
export const useCompartments = () => useContext(Ctx)

function loadAreas() {
  try {
    const raw = localStorage.getItem(AREA_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length) return arr
    }
  } catch { /* fall through */ }
  return DEFAULT_AREAS.map(a => ({ ...a }))
}

function loadCompartments(areas) {
  let list
  try {
    const raw = localStorage.getItem(COMP_KEY)
    const arr = raw ? JSON.parse(raw) : null
    list = Array.isArray(arr) && arr.length ? arr : DEFAULT_COMPARTMENTS.map(c => ({ ...c }))
  } catch {
    list = DEFAULT_COMPARTMENTS.map(c => ({ ...c }))
  }
  // Ensure every compartment belongs to an existing area.
  const areaIds = new Set(areas.map(a => a.id))
  const fallback = areas[0]?.id || DEFAULT_AREA_ID
  return list.map(c => ({ ...c, areaId: areaIds.has(c.areaId) ? c.areaId : fallback }))
}

const renumber = (list) => list.map((c, i) => ({ ...c, num: i + 1 }))

export function CompartmentsProvider({ children }) {
  const [areas, setAreas] = useState(loadAreas)
  const [compartments, setCompartments] = useState(() => loadCompartments(loadAreas()))

  const saveComps = useCallback((updater) => {
    setCompartments(cur => {
      const raw = typeof updater === 'function' ? updater(cur) : updater
      const next = renumber(raw)
      try { localStorage.setItem(COMP_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const saveAreas = useCallback((updater) => {
    setAreas(cur => {
      const next = typeof updater === 'function' ? updater(cur) : updater
      try { localStorage.setItem(AREA_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // ── compartments ──
  const addCompartment = useCallback((name, icon = '📦', areaId = DEFAULT_AREA_ID) => {
    saveComps(cur => [...cur, { id: newCompartmentId(), name: (name || '').trim() || 'New compartment', icon, areaId }])
  }, [saveComps])

  const updateCompartment = useCallback((id, patch) => {
    saveComps(cur => cur.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }, [saveComps])

  const deleteCompartment = useCallback((id) => {
    saveComps(cur => cur.filter(c => c.id !== id))
  }, [saveComps])

  const moveCompartment = useCallback((id, dir) => {
    saveComps(cur => {
      const i = cur.findIndex(c => c.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= cur.length) return cur
      const next = [...cur]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [saveComps])

  const setCompartmentPosition = useCallback((id, px, py) => {
    saveComps(cur => cur.map(c => (c.id === id ? { ...c, px, py } : c)))
  }, [saveComps])

  const resetCompartments = useCallback(() => {
    saveAreas(DEFAULT_AREAS.map(a => ({ ...a })))
    saveComps(() => DEFAULT_COMPARTMENTS.map(c => ({ ...c })))
  }, [saveComps, saveAreas])

  // ── areas ──
  const addArea = useCallback((name) => {
    const id = newAreaId()
    saveAreas(cur => [...cur, { id, name: (name || '').trim() || 'New area', image: null }])
    return id
  }, [saveAreas])

  const renameArea = useCallback((id, name) => {
    saveAreas(cur => cur.map(a => (a.id === id ? { ...a, name } : a)))
  }, [saveAreas])

  const setAreaImage = useCallback((id, image) => {
    saveAreas(cur => cur.map(a => (a.id === id ? { ...a, image } : a)))
  }, [saveAreas])

  const deleteArea = useCallback((id) => {
    setAreas(curAreas => {
      if (curAreas.length <= 1) return curAreas // keep at least one
      const remaining = curAreas.filter(a => a.id !== id)
      const fallback = remaining[0].id
      // Reassign this area's compartments to the first remaining area.
      saveComps(cur => cur.map(c => (c.areaId === id ? { ...c, areaId: fallback } : c)))
      try { localStorage.setItem(AREA_KEY, JSON.stringify(remaining)) } catch { /* ignore */ }
      return remaining
    })
  }, [saveComps])

  // For a future sync path.
  const importCompartments = useCallback((list) => {
    if (Array.isArray(list) && list.length) saveComps(list)
  }, [saveComps])
  const importAreas = useCallback((list) => {
    if (Array.isArray(list) && list.length) saveAreas(list)
  }, [saveAreas])

  const value = {
    compartments, areas,
    addCompartment, updateCompartment, deleteCompartment, moveCompartment,
    setCompartmentPosition, resetCompartments,
    addArea, renameArea, setAreaImage, deleteArea,
    importCompartments, importAreas,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
