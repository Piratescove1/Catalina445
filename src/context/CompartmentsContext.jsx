/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { DEFAULT_COMPARTMENTS, newCompartmentId } from '../data/compartments'

const KEY = 'c445-compartments'
const Ctx = createContext(null)
export const useCompartments = () => useContext(Ctx)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length) return arr
    }
  } catch { /* fall through */ }
  return DEFAULT_COMPARTMENTS.map(c => ({ ...c }))
}

const renumber = (list) => list.map((c, i) => ({ ...c, num: i + 1 }))

export function CompartmentsProvider({ children }) {
  const [compartments, setCompartments] = useState(load)

  const update = useCallback((updater) => {
    setCompartments(cur => {
      const raw = typeof updater === 'function' ? updater(cur) : updater
      const next = renumber(raw)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const addCompartment = useCallback((name, icon = '📦') => {
    update(cur => [...cur, { id: newCompartmentId(), name: (name || '').trim() || 'New compartment', icon }])
  }, [update])

  const updateCompartment = useCallback((id, patch) => {
    update(cur => cur.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }, [update])

  const deleteCompartment = useCallback((id) => {
    update(cur => cur.filter(c => c.id !== id))
  }, [update])

  const moveCompartment = useCallback((id, dir) => {
    update(cur => {
      const i = cur.findIndex(c => c.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= cur.length) return cur
      const next = [...cur]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [update])

  const resetCompartments = useCallback(() => {
    update(() => DEFAULT_COMPARTMENTS.map(c => ({ ...c })))
  }, [update])

  // For a future sync path (remote list wins when present).
  const importCompartments = useCallback((list) => {
    if (Array.isArray(list) && list.length) update(list)
  }, [update])

  const value = {
    compartments, addCompartment, updateCompartment, deleteCompartment,
    moveCompartment, resetCompartments, importCompartments,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
