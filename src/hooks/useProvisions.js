import { useState, useCallback } from 'react'
import { COMMON_PROVISIONS, PROVISION_CATEGORIES } from '../data/provisions'

const ITEMS_KEY = 'c445-provisions'
const CATS_KEY  = 'c445-prov-categories'

function defaultItems() {
  return COMMON_PROVISIONS.map(p => ({ ...p, checked: false }))
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {}
  return fallback
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export function useProvisions() {
  const [items,            setItems]      = useState(() => load(ITEMS_KEY, defaultItems()))
  const [customCategories, setCats]       = useState(() => load(CATS_KEY,  []))

  // Full ordered list: built-ins first, then user-added
  const allCategories = ['My Items', ...PROVISION_CATEGORIES, ...customCategories]

  // ── Item operations ────────────────────────────────────
  const toggleItem = useCallback((id) => {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it)
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  const addItem = useCallback((name, category = 'My Items') => {
    if (!name.trim()) return
    setItems(prev => {
      const next = [...prev, { id: Date.now(), name: name.trim(), category, checked: false, custom: true }]
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

  const clearList = useCallback(() => {
    setItems(prev => {
      const next = prev.map(it => ({ ...it, checked: false }))
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  const resetDefaults = useCallback(() => {
    const next = defaultItems()
    setItems(next)
    save(ITEMS_KEY, next)
  }, [])

  // ── Category operations ────────────────────────────────
  const addCategory = useCallback((name) => {
    if (!name.trim()) return
    setCats(prev => {
      if (prev.includes(name.trim())) return prev
      const next = [...prev, name.trim()]
      save(CATS_KEY, next)
      return next
    })
  }, [])

  const deleteCategory = useCallback((name) => {
    setCats(prev => {
      const next = prev.filter(c => c !== name)
      save(CATS_KEY, next)
      return next
    })
    // Reassign items that were in the deleted category to 'My Items'
    setItems(prev => {
      const next = prev.map(it => it.category === name ? { ...it, category: 'My Items' } : it)
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  const renameCategory = useCallback((oldName, newName) => {
    if (!newName.trim() || oldName === newName.trim()) return
    setCats(prev => {
      const next = prev.map(c => c === oldName ? newName.trim() : c)
      save(CATS_KEY, next)
      return next
    })
    setItems(prev => {
      const next = prev.map(it => it.category === oldName ? { ...it, category: newName.trim() } : it)
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  // ── Sync import ────────────────────────────────────────
  const importProvisions = useCallback((remoteItems, remoteCats) => {
    if (remoteItems) { setItems(remoteItems); save(ITEMS_KEY, remoteItems) }
    if (remoteCats)  { setCats(remoteCats);   save(CATS_KEY,  remoteCats)  }
  }, [])

  return {
    items, toggleItem, addItem, deleteItem, clearList, resetDefaults,
    allCategories, customCategories, addCategory, deleteCategory, renameCategory,
    importProvisions,
  }
}
