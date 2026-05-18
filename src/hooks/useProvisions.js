import { useState, useCallback } from 'react'
import { COMMON_PROVISIONS } from '../data/provisions'

const KEY = 'c445-provisions'

function defaultItems() {
  return COMMON_PROVISIONS.map(p => ({ ...p, checked: false }))
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return defaultItems()
}

function save(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {}
}

export function useProvisions() {
  const [items, setItems] = useState(load)

  const toggleItem = useCallback((id) => {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it)
      save(next)
      return next
    })
  }, [])

  const addItem = useCallback((name) => {
    if (!name.trim()) return
    setItems(prev => {
      const next = [...prev, { id: Date.now(), name: name.trim(), category: 'My Items', checked: true, custom: true }]
      save(next)
      return next
    })
  }, [])

  const deleteItem = useCallback((id) => {
    setItems(prev => {
      const next = prev.filter(it => it.id !== id)
      save(next)
      return next
    })
  }, [])

  const clearList = useCallback(() => {
    setItems(prev => {
      const next = prev.map(it => ({ ...it, checked: false }))
      save(next)
      return next
    })
  }, [])

  const importProvisions = useCallback((remote) => {
    if (remote) { setItems(remote); save(remote) }
  }, [])

  return { items, toggleItem, addItem, deleteItem, clearList, importProvisions }
}
