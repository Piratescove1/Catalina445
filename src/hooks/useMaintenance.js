/**
 * useMaintenance — manages maintenance log entries and future projects.
 *
 * Maintenance log entry: { id, date, projectName, replacementParts, workDoneBy,
 *   approxCost, notes, receipts: [{ id, name, type, addedAt }] }
 *   - receipts holds only lightweight metadata; the image/PDF bytes live in
 *     IndexedDB (see lib/receipts.js) so they don't bloat sync or localStorage.
 *
 * Future project: { id, projectName, description, parts: [{ id, name, checked }] }
 *   - parts is a shopping checklist — check off each part as you acquire it
 *
 * Both are persisted to localStorage and included in Firebase sync.
 */
import { useState, useCallback } from 'react'
import { saveReceipt, deleteReceipt as delReceiptBlob, deleteReceipts } from '../lib/receipts'
import { uploadReceipt, deleteRemoteReceipt } from '../lib/receiptSync'

const MAINTENANCE_KEY     = 'c445-maintenance'
const FUTURE_PROJECTS_KEY = 'c445-future-projects'

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* ignore */ }
}

export function useMaintenance() {
  const [maintenance,     setMaintenance]     = useState(() => load(MAINTENANCE_KEY))
  const [futureProjects,  setFutureProjects]  = useState(() => load(FUTURE_PROJECTS_KEY))

  // ── Maintenance log ─────────────────────────────────────

  const addEntry = useCallback((entry) => {
    setMaintenance(prev => {
      const next = [{ id: Date.now(), ...entry }, ...prev]
      save(MAINTENANCE_KEY, next)
      return next
    })
  }, [])

  const updateEntry = useCallback((id, updates) => {
    setMaintenance(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e)
      save(MAINTENANCE_KEY, next)
      return next
    })
  }, [])

  const deleteEntry = useCallback((id) => {
    setMaintenance(prev => {
      const gone = prev.find(e => e.id === id)
      if (gone?.receipts?.length) {
        const ids = gone.receipts.map(r => r.id)
        deleteReceipts(ids).catch(() => {})
        ids.forEach(rid => deleteRemoteReceipt(rid).catch(() => {}))
      }
      const next = prev.filter(e => e.id !== id)
      save(MAINTENANCE_KEY, next)
      return next
    })
  }, [])

  // Attach a receipt: store bytes in IndexedDB, keep metadata on the entry.
  const addReceipt = useCallback(async (entryId, { name, type, dataURL }) => {
    const id = `r${Date.now()}${Math.floor(Math.random() * 1000)}`
    const addedAt = Date.now()
    await saveReceipt({ id, entryId, name, type, dataURL, addedAt })
    setMaintenance(prev => {
      const next = prev.map(e => e.id === entryId
        ? { ...e, receipts: [...(e.receipts || []), { id, name, type, addedAt }] }
        : e)
      save(MAINTENANCE_KEY, next)
      return next
    })
    // Push the bytes to the cloud so other devices can get them (queues if offline).
    uploadReceipt(id).catch(() => {})
  }, [])

  const removeReceipt = useCallback(async (entryId, receiptId) => {
    await delReceiptBlob(receiptId).catch(() => {})
    deleteRemoteReceipt(receiptId).catch(() => {})
    setMaintenance(prev => {
      const next = prev.map(e => e.id === entryId
        ? { ...e, receipts: (e.receipts || []).filter(r => r.id !== receiptId) }
        : e)
      save(MAINTENANCE_KEY, next)
      return next
    })
  }, [])

  // ── Future projects ──────────────────────────────────────

  const addProject = useCallback((project) => {
    setFutureProjects(prev => {
      const next = [{ id: Date.now(), parts: [], ...project }, ...prev]
      save(FUTURE_PROJECTS_KEY, next)
      return next
    })
  }, [])

  const updateProject = useCallback((id, updates) => {
    setFutureProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p)
      save(FUTURE_PROJECTS_KEY, next)
      return next
    })
  }, [])

  const deleteProject = useCallback((id) => {
    setFutureProjects(prev => {
      const next = prev.filter(p => p.id !== id)
      save(FUTURE_PROJECTS_KEY, next)
      return next
    })
  }, [])

  const addPart = useCallback((projectId, partName) => {
    setFutureProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== projectId) return p
        const parts = [...p.parts, { id: Date.now(), name: partName, checked: false }]
        return { ...p, parts }
      })
      save(FUTURE_PROJECTS_KEY, next)
      return next
    })
  }, [])

  const togglePart = useCallback((projectId, partId) => {
    setFutureProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== projectId) return p
        const parts = p.parts.map(pt => pt.id === partId ? { ...pt, checked: !pt.checked } : pt)
        return { ...p, parts }
      })
      save(FUTURE_PROJECTS_KEY, next)
      return next
    })
  }, [])

  const deletePart = useCallback((projectId, partId) => {
    setFutureProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== projectId) return p
        return { ...p, parts: p.parts.filter(pt => pt.id !== partId) }
      })
      save(FUTURE_PROJECTS_KEY, next)
      return next
    })
  }, [])

  // ── Import (for Firebase sync) ───────────────────────────

  const importMaintenance = useCallback((maint, future) => {
    if (maint)  { setMaintenance(maint);       save(MAINTENANCE_KEY,     maint)  }
    if (future) { setFutureProjects(future);   save(FUTURE_PROJECTS_KEY, future) }
  }, [])

  return {
    maintenance, addEntry, updateEntry, deleteEntry, addReceipt, removeReceipt,
    futureProjects, addProject, updateProject, deleteProject,
    addPart, togglePart, deletePart,
    importMaintenance,
  }
}
