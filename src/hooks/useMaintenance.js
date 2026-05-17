/**
 * useMaintenance — manages maintenance log entries.
 *
 * Each entry: { id, date, projectName, replacementParts, workDoneBy, approxCost, notes }
 *
 * Persisted to localStorage so it works offline.
 * Included in Firebase sync alongside inventory and voyages.
 */
import { useState, useCallback } from 'react'

const MAINTENANCE_KEY = 'c445-maintenance'

function loadMaintenance() {
  try {
    const raw = localStorage.getItem(MAINTENANCE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function save(data) {
  try { localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(data)) } catch {}
}

export function useMaintenance() {
  const [maintenance, setMaintenance] = useState(loadMaintenance)

  const addEntry = useCallback((entry) => {
    setMaintenance(prev => {
      const next = [{ id: Date.now(), ...entry }, ...prev]
      save(next)
      return next
    })
  }, [])

  const updateEntry = useCallback((id, updates) => {
    setMaintenance(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e)
      save(next)
      return next
    })
  }, [])

  const deleteEntry = useCallback((id) => {
    setMaintenance(prev => {
      const next = prev.filter(e => e.id !== id)
      save(next)
      return next
    })
  }, [])

  const importMaintenance = useCallback((data) => {
    if (data) { setMaintenance(data); save(data) }
  }, [])

  return { maintenance, addEntry, updateEntry, deleteEntry, importMaintenance }
}
