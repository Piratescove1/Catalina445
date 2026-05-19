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
 * Offline handling: if the device goes offline and the user makes changes,
 * those changes are held in pendingData. When the device reconnects, the user
 * is asked whether to push their local changes or pull the server version.
 *
 * Status values: 'connecting' | 'syncing' | 'synced' | 'offline' | 'unconfigured'
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
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

export function useSync({ inventory, voyages, maintenance, futureProjects, ditchSop, ditchItems, lockerInventory, provItems, provCategories, labels, prefs, onRemoteData }) {
  const [status, setStatus]           = useState(configured ? 'connecting' : 'unconfigured')
  const [pendingSync, setPendingSync] = useState(false)
  const [boatId]                      = useState(getBoatId)
  const ignoreNext                    = useRef(false)
  const pushTimer                     = useRef(null)
  const offlineDirty                  = useRef(false)
  const pendingData                   = useRef(null)

  // Instantly reflect browser online/offline events
  useEffect(() => {
    if (!configured) return
    const goOffline = () => setStatus('offline')
    const goOnline = () => {
      if (offlineDirty.current) setPendingSync(true)
      else setStatus('connecting')
    }
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
        onRemoteData(data.inventory, data.voyages, data.maintenance, data.futureProjects, data.ditchSop, data.ditchItems, data.lockerInventory, data.provItems, data.provCategories, data.labels, data.prefs)
        setTimeout(() => { ignoreNext.current = false }, 1000)
        setStatus('synced')
      },
      () => setStatus('offline')
    )
    return unsub
  }, [boatId, onRemoteData])

  // Debounced push — skips if offline (tracks dirty state instead)
  const push = useCallback((inv, voy, maint, future, dSop, dItems, lockers, prov, provCats, lbls, prfs) => {
    if (!configured || !db || ignoreNext.current || pendingSync) return
    if (!navigator.onLine) {
      offlineDirty.current = true
      pendingData.current = { inv, voy, maint, future, dSop, dItems, lockers, prov, provCats, lbls, prfs }
      return
    }
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      if (!navigator.onLine) {
        offlineDirty.current = true
        pendingData.current = { inv, voy, maint, future, dSop, dItems, lockers, prov, provCats, lbls, prfs }
        return
      }
      setStatus('syncing')
      try {
        await setDoc(doc(db, 'boats', boatId), {
          inventory:       inv      || [],
          voyages:         voy      || [],
          maintenance:     maint    || [],
          futureProjects:  future   || [],
          ditchSop:        dSop     || '',
          ditchItems:      dItems   || [],
          lockerInventory: lockers  || {},
          provItems:       prov     || [],
          provCategories:  provCats || [],
          labels:          lbls     || {},
          prefs:           prfs     || {},
          deviceId: DEVICE_ID,
          updatedAt: Date.now(),
        })
        setStatus('synced')
      } catch (e) { console.error('Firestore push failed:', e); setStatus('offline') }
    }, 1500)
  }, [boatId, pendingSync])

  // Called from App when user responds to the reconnect dialog
  const resolveSync = useCallback(async (keepLocal) => {
    setPendingSync(false)
    offlineDirty.current = false
    if (keepLocal && pendingData.current) {
      const { inv, voy, maint, future, dSop, dItems, lockers, prov, provCats, lbls, prfs } = pendingData.current
      setStatus('syncing')
      try {
        await setDoc(doc(db, 'boats', boatId), {
          inventory:       inv      || [],
          voyages:         voy      || [],
          maintenance:     maint    || [],
          futureProjects:  future   || [],
          ditchSop:        dSop     || '',
          ditchItems:      dItems   || [],
          lockerInventory: lockers  || {},
          provItems:       prov     || [],
          provCategories:  provCats || [],
          labels:          lbls     || {},
          prefs:           prfs     || {},
          deviceId: DEVICE_ID,
          updatedAt: Date.now(),
        })
        setStatus('synced')
      } catch (e) { console.error('Firestore resolveSync failed:', e); setStatus('offline') }
    } else {
      setStatus('connecting')
      try {
        const snap = await getDoc(doc(db, 'boats', boatId))
        if (snap.exists()) {
          const data = snap.data()
          ignoreNext.current = true
          onRemoteData(data.inventory, data.voyages, data.maintenance, data.futureProjects, data.ditchSop, data.ditchItems, data.lockerInventory, data.provItems, data.provCategories, data.labels, data.prefs)
          setTimeout(() => { ignoreNext.current = false }, 1000)
        }
        setStatus('synced')
      } catch { setStatus('offline') }
    }
    pendingData.current = null
  }, [boatId, onRemoteData])

  return { status, boatId, push, pendingSync, resolveSync }
}
