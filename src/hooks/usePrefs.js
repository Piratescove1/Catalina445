import { useState, useCallback } from 'react'

const PREFS_KEY = 'c445-prefs'

const DEFAULTS = {
  boatName: 'Catalina 445',
}

function load() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULTS }
}

function save(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch {}
}

export function usePrefs() {
  const [prefs, setPrefs] = useState(load)

  const setPref = useCallback((key, value) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value }
      save(next)
      return next
    })
  }, [])

  const importPrefs = useCallback((data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return
    setPrefs(prev => {
      const next = { ...DEFAULTS, ...prev, ...data }
      save(next)
      return next
    })
  }, [])

  return { prefs, setPref, importPrefs }
}
