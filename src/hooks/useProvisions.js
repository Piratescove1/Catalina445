import { useState, useCallback } from 'react'
import { COMMON_PROVISIONS, PROVISION_CATEGORIES } from '../data/provisions'

const ITEMS_KEY = 'c445-provisions'
const CATS_KEY  = 'c445-prov-categories'

function defaultItems() {
  return COMMON_PROVISIONS.map(p => ({ ...p, checked: false }))
}

// Default category order: My Items first, then the built-in list
function defaultCategories() {
  return ['My Items', ...PROVISION_CATEGORIES]
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
  const [items,      setItems] = useState(() => load(ITEMS_KEY, defaultItems()))
  const [categories, setCats]  = useState(() => {
    const stored = load(CATS_KEY, null)
    // Migrate: old format stored [] (custom-only); treat empty array as unset
    return (stored && stored.length > 0) ? stored : defaultCategories()
  })

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

  const renameItem = useCallback((id, newName) => {
    if (!newName.trim()) return
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, name: newName.trim() } : it)
      save(ITEMS_KEY, next)
      return next
    })
  }, [])

  const moveItem = useCallback((id, direction) => {
    setItems(prev => {
      const item = prev.find(it => it.id === id)
      if (!item) return prev
      // Work within the same category's slice
      const catItems = prev.filter(it => it.category === item.category)
      const catIdx   = catItems.findIndex(it => it.id === id)
      const target   = catIdx + direction
      if (target < 0 || target >= catItems.length) return prev
      // Swap in the flat array using global indices
      const next      = [...prev]
      const idxA      = next.indexOf(item)
      const idxB      = next.indexOf(catItems[target])
      ;[next[idxA], next[idxB]] = [next[idxB], next[idxA]]
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
    const nextItems = defaultItems()
    const nextCats  = defaultCategories()
    setItems(nextItems); save(ITEMS_KEY, nextItems)
    setCats(nextCats);   save(CATS_KEY,  nextCats)
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
      if (prev.length <= 1) return prev       // always keep at least one
      const next = prev.filter(c => c !== name)
      save(CATS_KEY, next)
      // Reassign orphaned items to the first remaining category
      setItems(items => {
        const fallback = next[0]
        const ni = items.map(it => it.category === name ? { ...it, category: fallback } : it)
        save(ITEMS_KEY, ni)
        return ni
      })
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

  const moveCategory = useCallback((index, direction) => {
    setCats(prev => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      save(CATS_KEY, next)
      return next
    })
  }, [])

  // ── Sync import ────────────────────────────────────────
  const importProvisions = useCallback((remoteItems, remoteCats) => {
    if (remoteItems) { setItems(remoteItems); save(ITEMS_KEY, remoteItems) }
    if (remoteCats)  { setCats(remoteCats);   save(CATS_KEY,  remoteCats)  }
  }, [])

  return {
    items, toggleItem, addItem, deleteItem, renameItem, moveItem, clearList, resetDefaults,
    categories, addCategory, deleteCategory, renameCategory, moveCategory,
    importProvisions,
  }
}
