import { useState, useCallback } from 'react'

const LABELS_KEY = 'c445-labels'

function load() {
  try {
    const raw = localStorage.getItem(LABELS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function save(data) {
  try { localStorage.setItem(LABELS_KEY, JSON.stringify(data)) } catch {}
}

export function useLabels() {
  const [labels, setLabels] = useState(load)

  const setLabel = useCallback((id, name) => {
    setLabels(prev => {
      const trimmed = name.trim()
      const next = trimmed
        ? { ...prev, [id]: trimmed }
        : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id))
      save(next)
      return next
    })
  }, [])

  const getLabel = useCallback((id, defaultName) => labels[id] || defaultName, [labels])

  const importLabels = useCallback((data) => {
    if (data && typeof data === 'object') { setLabels(data); save(data) }
  }, [])

  return { labels, setLabel, getLabel, importLabels }
}
