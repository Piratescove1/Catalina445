/**
 * useDitchBag — manages the abandon-ship ditch bag.
 *
 * sop: string — Abandon Ship SOP instructions (free text)
 * items: [{ id, name, qty, packed }] — gear checklist
 *
 * Both are persisted to localStorage and included in Firebase sync.
 */
import { useState, useCallback } from 'react'

const SOP_KEY   = 'c445-ditch-sop'
const ITEMS_KEY = 'c445-ditch-items'

function loadStr(key) {
  try { return localStorage.getItem(key) || '' } catch { return '' }
}

function loadArr(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function save(key, data) {
  try { localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data)) } catch {}
}

export function useDitchBag() {
  const [sop,   setSopState]   = useState(() => loadStr(SOP_KEY))
  const [items, setItems] = useState(() => loadArr(ITEMS_KEY))

  const setSop = useCallback((text) => {
    setSopState(text)
    save(SOP_KEY, text)
  }, [])

  const addItem = useCallback((name, qty) => {
    setItems(prev => {
      const next = [...prev, { id: Date.now(), name, qty, packed: false }]
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  const updateItem = useCallback((id, updates) => {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, ...updates } : it)
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  const deleteItem = useCallback((id) => {
    setItems(prev => {
      const next = prev.filter(it => it.id !== id)
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  const togglePacked = useCallback((id) => {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, packed: !it.packed } : it)
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  const importDitchBag = useCallback((remoteSop, remoteItems) => {
    if (remoteSop !== undefined && remoteSop !== null) { setSopState(remoteSop); save(SOP_KEY, remoteSop) }
    if (remoteItems)  { setItems(remoteItems);  save(ITEMS_KEY, remoteItems) }
  }, [])

  return { sop, setSop, items, addItem, updateItem, deleteItem, togglePacked, importDitchBag }
}
