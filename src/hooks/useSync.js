import { useEffect, useRef, useCallback, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, configured } from '../lib/firebase'

const BOAT_ID_KEY = 'c445-boat-id'
const DEVICE_ID   = Math.random().toString(36).slice(2, 10)

export function getBoatId() {
  let id = localStorage.getItem(BOAT_ID_KEY)
  if (!id) {
    id = Math.random().toString(36).slice(2, 8).toUpperCase()
    localStorage.setItem(BOAT_ID_KEY, id)
  }
  return id
}

export function joinBoat(id) {
  localStorage.setItem(BOAT_ID_KEY, id.trim().toUpperCase())
  window.location.reload()
}

export function useSync({ inventory, voyages, onRemoteData }) {
  const [status, setStatus]   = useState(configured ? 'connecting' : 'unconfigured')
  const [boatId]              = useState(getBoatId)
  const ignoreNext            = useRef(false)
  const pushTimer             = useRef(null)

  // Listen for remote changes
  useEffect(() => {
    if (!configured || !db) return
    const ref = doc(db, 'boats', boatId)
    const unsub = onSnapshot(
      ref,
      snap => {
        if (!snap.exists()) { setStatus('synced'); return }
        const data = snap.data()
        if (data.deviceId === DEVICE_ID) { setStatus('synced'); return }
        ignoreNext.current = true
        onRemoteData(data.inventory, data.voyages)
        setTimeout(() => { ignoreNext.current = false }, 1000)
        setStatus('synced')
      },
      () => setStatus('offline')
    )
    return unsub
  }, [boatId, onRemoteData])

  // Debounced push — waits 1.5s after last change before writing
  const push = useCallback((inv, voy) => {
    if (!configured || !db || ignoreNext.current) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      setStatus('syncing')
      try {
        await setDoc(doc(db, 'boats', boatId), {
          inventory: inv,
          voyages: voy,
          deviceId: DEVICE_ID,
          updatedAt: Date.now(),
        })
        setStatus('synced')
      } catch {
        setStatus('offline')
      }
    }, 1500)
  }, [boatId])

  return { status, boatId, push }
}
