import { useState, useCallback } from 'react'
import { COMPARTMENTS } from '../data/compartments'

const STORAGE_KEY = 'c445-inventory'
const VOYAGES_KEY = 'c445-voyages'

function loadInventory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // Default: all compartments with empty item lists
  return Object.fromEntries(COMPARTMENTS.map(c => [c.id, []]))

}

function loadVoyages() {
  try {
    const raw = localStorage.getItem(VOYAGES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export function useInventory() {
  const [inventory, setInventory] = useState(loadInventory)
  const [voyages, setVoyages] = useState(loadVoyages)

  const updateInventory = useCallback((updater) => {
    setInventory(prev => {
      const next = updater(prev)
      save(STORAGE_KEY, next)
      return next
    })
  }, [])

  // items: [{ name, qty, unit }]
  const addItem = useCallback((compartmentId, name, qty = 1, unit = '') => {
    updateInventory(prev => {
      const items = prev[compartmentId] || []
      const idx = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase())
      let next
      if (idx >= 0) {
        next = items.map((item, i) => i === idx ? { ...item, qty: item.qty + qty } : item)
      } else {
        next = [...items, { name, qty, unit, addedAt: Date.now() }]
      }
      return { ...prev, [compartmentId]: next }
    })
  }, [updateInventory])

  const removeItem = useCallback((compartmentId, name, qty = 1) => {
    updateInventory(prev => {
      const items = prev[compartmentId] || []
      const idx = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase())
      if (idx < 0) return prev
      const item = items[idx]
      let next
      if (item.qty - qty <= 0) {
        next = items.filter((_, i) => i !== idx)
      } else {
        next = items.map((it, i) => i === idx ? { ...it, qty: it.qty - qty } : it)
      }
      return { ...prev, [compartmentId]: next }
    })
  }, [updateInventory])

  const setItemQty = useCallback((compartmentId, name, qty) => {
    updateInventory(prev => {
      const items = prev[compartmentId] || []
      const idx = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase())
      if (idx < 0) return prev
      let next
      if (qty <= 0) {
        next = items.filter((_, i) => i !== idx)
      } else {
        next = items.map((it, i) => i === idx ? { ...it, qty } : it)
      }
      return { ...prev, [compartmentId]: next }
    })
  }, [updateInventory])

  const deleteItem = useCallback((compartmentId, name) => {
    updateInventory(prev => {
      const items = (prev[compartmentId] || []).filter(i => i.name.toLowerCase() !== name.toLowerCase())
      return { ...prev, [compartmentId]: items }
    })
  }, [updateInventory])

  const findItem = useCallback((name) => {
    // Search all compartments for an item by name, return [{ compartmentId, item }]
    const results = []
    for (const [cid, items] of Object.entries(inventory)) {
      for (const item of items) {
        if (item.name.toLowerCase().includes(name.toLowerCase())) {
          results.push({ compartmentId: cid, item })
        }
      }
    }
    return results
  }, [inventory])

  // ── Voyages ──────────────────────────────────────────────

  const startVoyage = useCallback((destination = '') => {
    const voyage = {
      id: Date.now(),
      destination,
      startTime: new Date().toISOString(),
      endTime: null,
      notes: [],
      status: 'active',
    }
    setVoyages(prev => {
      const next = [voyage, ...prev]
      save(VOYAGES_KEY, next)
      return next
    })
    return voyage.id
  }, [])

  const endVoyage = useCallback((id) => {
    setVoyages(prev => {
      const next = prev.map(v => v.id === id ? { ...v, endTime: new Date().toISOString(), status: 'completed' } : v)
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const updateLogEntry = useCallback((voyageId, index, updates) => {
    setVoyages(prev => {
      const next = prev.map(v => {
        if (v.id !== voyageId) return v
        const notes = v.notes.map((n, i) => i === index ? { ...n, ...updates } : n)
        return { ...v, notes }
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const renameVoyage = useCallback((id, name) => {
    setVoyages(prev => {
      const next = prev.map(v => v.id === id ? { ...v, name, destination: name } : v)
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const resumeVoyage = useCallback((id) => {
    setVoyages(prev => {
      // End any currently active voyage first
      const next = prev.map(v => {
        if (v.id === id) return { ...v, status: 'active', endTime: null }
        if (v.status === 'active') return { ...v, status: 'completed', endTime: new Date().toISOString() }
        return v
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  // entry can be a string (plain note) or object { lat, lon, cog, sog, awa, aws, text }
  const addLogEntry = useCallback((id, entry) => {
    const record = typeof entry === 'string'
      ? { time: new Date().toISOString(), text: entry }
      : { time: new Date().toISOString(), ...entry }
    setVoyages(prev => {
      const next = prev.map(v =>
        v.id === id ? { ...v, notes: [...v.notes, record] } : v
      )
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const addVoyageNote = useCallback((id, text) => addLogEntry(id, text), [addLogEntry])

  const importData = useCallback((inv, voy) => {
    if (inv) { setInventory(inv); save(STORAGE_KEY, inv) }
    if (voy) { setVoyages(voy);   save(VOYAGES_KEY, voy) }
  }, [])

  const activeVoyage = voyages.find(v => v.status === 'active') || null

  return {
    inventory,
    voyages,
    activeVoyage,
    addItem,
    removeItem,
    setItemQty,
    deleteItem,
    findItem,
    startVoyage,
    endVoyage,
    resumeVoyage,
    renameVoyage,
    updateLogEntry,
    importData,
    addVoyageNote,
    addLogEntry,
  }
}
