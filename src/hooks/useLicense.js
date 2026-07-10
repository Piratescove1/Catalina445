import { useState, useEffect, useCallback } from 'react'
import { computeLicense, fetchCloudLicense } from '../lib/license'

// Tracks license status; refreshes from the cloud license doc when online.
export function useLicense(boatId) {
  const [state, setState] = useState(() => computeLicense())

  useEffect(() => {
    let active = true
    fetchCloudLicense(boatId).then(() => { if (active) setState(computeLicense()) })
    return () => { active = false }
  }, [boatId])

  const refresh = useCallback(() => setState(computeLicense()), [])
  return { ...state, refresh }
}
