/**
 * useInventory — manages all inventory and voyage state.
 *
 * Inventory is a plain object keyed by compartment id:
 *   { "comp-1": [{ name, qty, unit, addedAt }], ... }
 *
 * Voyages is an array of voyage objects:
 *   [{ id, name, destination, startTime, endTime, status, sails[] }]
 *
 * Each sail: { id, name, startTime, endTime, status, notes[] }
 * Each note: { time, lat, lon, cog, sog, awa, aws, text }
 *
 * Both are persisted to localStorage on every change so they survive
 * page reloads and work fully offline.
 */
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

// Converts legacy voyages (notes[] at voyage level) to new format (sails[]).
// Safe to run on already-migrated data — voyages with sails pass through unchanged.
// Active voyages with no entries get no sail so the user sees the "Start Sail" prompt.
function migrateVoyage(v) {
  if (v.sails !== undefined) return v
  const legacyNotes = v.notes || []
  const { notes, ...rest } = v
  if (legacyNotes.length === 0) {
    return { ...rest, sails: [] }
  }
  const sailStatus = v.status === 'active' ? 'active' : 'completed'
  return {
    ...rest,
    sails: [{
      id: v.id,
      name: 'Sail 1',
      startTime: v.startTime,
      endTime: sailStatus === 'completed' ? v.endTime : null,
      status: sailStatus,
      notes: legacyNotes,
    }],
  }
}

function loadVoyages() {
  try {
    const raw = localStorage.getItem(VOYAGES_KEY)
    if (raw) return JSON.parse(raw).map(migrateVoyage)
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

  const renameItem = useCallback((compartmentId, oldName, newName) => {
    if (!newName.trim()) return
    updateInventory(prev => {
      const items = (prev[compartmentId] || []).map(it =>
        it.name.toLowerCase() === oldName.toLowerCase() ? { ...it, name: newName.trim() } : it
      )
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
      sails: [],
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
      const next = prev.map(v => {
        if (v.id !== id) return v
        const sails = v.sails.map(s =>
          s.status === 'active' ? { ...s, status: 'completed', endTime: new Date().toISOString() } : s
        )
        return { ...v, sails, endTime: new Date().toISOString(), status: 'completed' }
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
      const next = prev.map(v => {
        if (v.id === id) return { ...v, status: 'active', endTime: null }
        if (v.status === 'active') return { ...v, status: 'completed', endTime: new Date().toISOString() }
        return v
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const deleteVoyage = useCallback((id) => {
    setVoyages(prev => {
      const next = prev.filter(v => v.id !== id)
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  // ── Sails ──────────────────────────────────────────────

  const startSail = useCallback((voyageId, name = '') => {
    const sail = {
      id: Date.now(),
      name,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      notes: [],
    }
    setVoyages(prev => {
      const next = prev.map(v => {
        if (v.id !== voyageId) return v
        const sails = v.sails.map(s =>
          s.status === 'active' ? { ...s, status: 'completed', endTime: new Date().toISOString() } : s
        )
        return { ...v, sails: [...sails, sail] }
      })
      save(VOYAGES_KEY, next)
      return next
    })
    return sail.id
  }, [])

  const endSail = useCallback((voyageId, sailId) => {
    setVoyages(prev => {
      const next = prev.map(v => {
        if (v.id !== voyageId) return v
        const sails = v.sails.map(s =>
          s.id === sailId ? { ...s, status: 'completed', endTime: new Date().toISOString() } : s
        )
        return { ...v, sails }
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const renameSail = useCallback((voyageId, sailId, name) => {
    setVoyages(prev => {
      const next = prev.map(v => {
        if (v.id !== voyageId) return v
        const sails = v.sails.map(s => s.id === sailId ? { ...s, name } : s)
        return { ...v, sails }
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const deleteSail = useCallback((voyageId, sailId) => {
    setVoyages(prev => {
      const next = prev.map(v => {
        if (v.id !== voyageId) return v
        return { ...v, sails: v.sails.filter(s => s.id !== sailId) }
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  // ── Log Entries ──────────────────────────────────────────────

  // entry can be a string (plain note) or object { lat, lon, cog, sog, awa, aws, text }
  const addLogEntry = useCallback((voyageId, sailId, entry) => {
    const record = typeof entry === 'string'
      ? { time: new Date().toISOString(), text: entry }
      : { time: new Date().toISOString(), ...entry }
    setVoyages(prev => {
      const next = prev.map(v => {
        if (v.id !== voyageId) return v
        const sails = v.sails.map(s =>
          s.id === sailId ? { ...s, notes: [...s.notes, record] } : s
        )
        return { ...v, sails }
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const updateLogEntry = useCallback((voyageId, sailId, index, updates) => {
    setVoyages(prev => {
      const next = prev.map(v => {
        if (v.id !== voyageId) return v
        const sails = v.sails.map(s => {
          if (s.id !== sailId) return s
          const notes = s.notes.map((n, i) => i === index ? { ...n, ...updates } : n)
          return { ...s, notes }
        })
        return { ...v, sails }
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const deleteLogEntry = useCallback((voyageId, sailId, index) => {
    setVoyages(prev => {
      const next = prev.map(v => {
        if (v.id !== voyageId) return v
        const sails = v.sails.map(s => {
          if (s.id !== sailId) return s
          const notes = s.notes.filter((_, i) => i !== index)
          return { ...s, notes }
        })
        return { ...v, sails }
      })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  // For voice commands — finds active sail or auto-creates one
  const addVoyageNote = useCallback((voyageId, text) => {
    setVoyages(prev => {
      const voyage = prev.find(v => v.id === voyageId)
      if (!voyage) return prev
      const record = { time: new Date().toISOString(), text }
      const activeSail = voyage.sails.find(s => s.status === 'active')
      if (activeSail) {
        const next = prev.map(v => {
          if (v.id !== voyageId) return v
          const sails = v.sails.map(s =>
            s.id === activeSail.id ? { ...s, notes: [...s.notes, record] } : s
          )
          return { ...v, sails }
        })
        save(VOYAGES_KEY, next)
        return next
      }
      const newSail = {
        id: Date.now(),
        name: `Sail ${voyage.sails.length + 1}`,
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'active',
        notes: [record],
      }
      const next = prev.map(v => v.id !== voyageId ? v : { ...v, sails: [...v.sails, newSail] })
      save(VOYAGES_KEY, next)
      return next
    })
  }, [])

  const importData = useCallback((inv, voy) => {
    if (inv) { setInventory(inv); save(STORAGE_KEY, inv) }
    if (voy) { setVoyages(voy.map(migrateVoyage)); save(VOYAGES_KEY, voy.map(migrateVoyage)) }
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
    renameItem,
    startVoyage,
    endVoyage,
    resumeVoyage,
    renameVoyage,
    startSail,
    endSail,
    renameSail,
    deleteSail,
    addLogEntry,
    updateLogEntry,
    deleteLogEntry,
    addVoyageNote,
    deleteVoyage,
    importData,
  }
}
