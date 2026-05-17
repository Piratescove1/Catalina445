/**
 * useSync — real-time cross-device sync via Firebase Firestore.
 *
 * Each boat has a 6-character uppercase Boat Code stored in localStorage.
 * All devices that share the same code read/write the same Firestore document
 * at boats/{boatId}.
 *
 * Loop prevention: every device generates a random DEVICE_ID at startup.
 * When a Firestore snapshot arrives with our own DEVICE_ID, we ignore it —
 * that was our own push echoing back.
 *
 * Writes are debounced 1.5s so rapid changes (e.g. voice commands) don't
 * hammer Firestore with one write per keystroke.
 *
 * Status values: 'connecting' | 'syncing' | 'synced' | 'offline' | 'unconfigured'
 */
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

  // Instantly reflect browser online/offline events (fires immediately on iOS when WiFi drops)
  useEffect(() => {
    if (!configured) return
    const goOffline = () => setStatus('offline')
    const goOnline  = () => setStatus('connecting')
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

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
