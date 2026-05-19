import { useState, useCallback } from 'react'
import { LOCKERS } from '../data/lockers'

const STORAGE_KEY = 'c445-locker-inventory'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return Object.fromEntries(LOCKERS.map(l => [l.id, []]))
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export function useLockers() {
  const [lockerInventory, setLockerInventory] = useState(load)

  const update = useCallback((updater) => {
    setLockerInventory(prev => {
      const next = updater(prev)
      save(next)
      return next
    })
  }, [])

  const addLockerItem = useCallback((lockerId, name, qty = 1, unit = '') => {
    update(prev => {
      const items = prev[lockerId] || []
      const idx = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase())
      const next = idx >= 0
        ? items.map((it, i) => i === idx ? { ...it, qty: it.qty + qty } : it)
        : [...items, { name, qty, unit, addedAt: Date.now() }]
      return { ...prev, [lockerId]: next }
    })
  }, [update])

  const removeLockerItem = useCallback((lockerId, name, qty = 1) => {
    update(prev => {
      const items = prev[lockerId] || []
      const idx = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase())
      if (idx < 0) return prev
      const item = items[idx]
      const next = item.qty - qty <= 0
        ? items.filter((_, i) => i !== idx)
        : items.map((it, i) => i === idx ? { ...it, qty: it.qty - qty } : it)
      return { ...prev, [lockerId]: next }
    })
  }, [update])

  const setLockerItemQty = useCallback((lockerId, name, qty) => {
    update(prev => {
      const items = prev[lockerId] || []
      const idx = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase())
      if (idx < 0) return prev
      const next = qty <= 0
        ? items.filter((_, i) => i !== idx)
        : items.map((it, i) => i === idx ? { ...it, qty } : it)
      return { ...prev, [lockerId]: next }
    })
  }, [update])

  const deleteLockerItem = useCallback((lockerId, name) => {
    update(prev => {
      const items = (prev[lockerId] || []).filter(i => i.name.toLowerCase() !== name.toLowerCase())
      return { ...prev, [lockerId]: items }
    })
  }, [update])

  const renameLockerItem = useCallback((lockerId, oldName, newName) => {
    if (!newName.trim()) return
    update(prev => {
      const items = (prev[lockerId] || []).map(it =>
        it.name.toLowerCase() === oldName.toLowerCase() ? { ...it, name: newName.trim() } : it
      )
      return { ...prev, [lockerId]: items }
    })
  }, [update])

  const importLockers = useCallback((data) => {
    if (data) { setLockerInventory(data); save(data) }
  }, [])

  return { lockerInventory, addLockerItem, removeLockerItem, setLockerItemQty, deleteLockerItem, renameLockerItem, importLockers }
}
