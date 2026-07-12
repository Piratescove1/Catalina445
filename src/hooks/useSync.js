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
import {
  doc, onSnapshot, setDoc, getDoc,
  collection, addDoc, getDocs, query, orderBy, deleteDoc,
} from 'firebase/firestore'
import { db, configured } from '../lib/firebase'

const BOAT_ID_KEY = 'c445-boat-id'
const DEVICE_ID   = Math.random().toString(36).slice(2, 10)

// Automatic cloud history: snapshot at most this often, keep this many.
const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000
const MAX_SNAPSHOTS = 20

// TEMPORARILY OFF until Phase 3 (a shared boat key across devices). While off,
// the cloud stores plaintext so devices that each have their own local key can
// still sync with each other. Reads still DECRYPT any legacy-encrypted doc, so
// nothing is lost, and the copy is converted back to plaintext on next load.
// Flip to true once Phase 3 shares one key across all devices.
const CLOUD_ENCRYPTION = false

function buildPayload(inv, voy, maint, future, dSop, dItems, lockers, prov, provCats, lbls, prfs) {
  // Note: provisioning (prov/provCats) is intentionally NOT synced per boat —
  // it's a shared, boat-agnostic list, so it's excluded from the per-boat doc.
  return {
    inventory:       inv      || [],
    voyages:         voy      || [],
    maintenance:     maint    || [],
    futureProjects:  future   || [],
    ditchSop:        dSop     || '',
    ditchItems:      dItems   || [],
    lockerInventory: lockers  || {},
    labels:          lbls     || {},
    prefs:           prfs     || {},
  }
}

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

export function useSync({ inventory, voyages, maintenance, futureProjects, ditchSop, ditchItems, lockerInventory, provItems, provCategories, labels, prefs, onRemoteData, encrypt, decrypt }) {
  const [status, setStatus]           = useState(configured ? 'connecting' : 'unconfigured')
  const [pendingSync, setPendingSync] = useState(false)
  const [boatId]                      = useState(getBoatId)
  const ignoreNext                    = useRef(false)
  const pushTimer                     = useRef(null)
  const offlineDirty                  = useRef(false)
  const pendingData                   = useRef(null)
  // True once we've received the first server snapshot. We never push before
  // this, so a freshly-loaded (possibly empty) device can't clobber the cloud
  // copy before it has had a chance to download it.
  const hydrated                      = useRef(false)
  const lastSnapshot                  = useRef(0)

  // Push the decrypted payload fields up to the app.
  const applyRemote = useCallback((p) => {
    onRemoteData(p.inventory, p.voyages, p.maintenance, p.futureProjects, p.ditchSop, p.ditchItems, p.lockerInventory, p.provItems, p.provCategories, p.labels, p.prefs)
  }, [onRemoteData])

  // Wrap a payload for the cloud: encrypted end-to-end when we have a key.
  const toCloud = useCallback(async (payload) => {
    if (CLOUD_ENCRYPTION && encrypt) return { enc: await encrypt(payload), v: 2 }
    return payload // plaintext while cloud encryption is off (pre-Phase 3)
  }, [encrypt])

  // Read a cloud doc's payload, handling both encrypted (v2) and legacy plaintext.
  const fromCloud = useCallback(async (data) => {
    if (data && data.enc) {
      if (!decrypt) throw new Error('no-key')
      return await decrypt(data.enc)
    }
    return buildPayload(data.inventory, data.voyages, data.maintenance, data.futureProjects, data.ditchSop, data.ditchItems, data.lockerInventory, data.provItems, data.provCategories, data.labels, data.prefs)
  }, [decrypt])

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
      async snap => {
        if (!snap.exists()) { hydrated.current = true; setStatus('synced'); return }
        const data = snap.data()
        if (data.deviceId === DEVICE_ID) { hydrated.current = true; setStatus('synced'); return }
        try {
          const payload = await fromCloud(data)
          ignoreNext.current = true
          applyRemote(payload)
          setTimeout(() => { ignoreNext.current = false }, 1000)
          // Convert the stored copy to the current mode (encrypted vs plaintext)
          // whenever we can read it — migrates the cloud doc after a mode switch.
          const storedEncrypted = !!data.enc
          if (storedEncrypted !== CLOUD_ENCRYPTION && (!CLOUD_ENCRYPTION || !!encrypt)) {
            try {
              const body = await toCloud(payload)
              await setDoc(ref, { ...body, deviceId: DEVICE_ID, updatedAt: Date.now() })
            } catch (e) { console.error('Cloud mode migration failed:', e) }
          }
        } catch (e) {
          // Can't read remote (e.g. undecryptable) — keep local data, don't clobber.
          console.error('Skipping unreadable remote data:', e)
        }
        hydrated.current = true
        setStatus('synced')
      },
      () => setStatus('offline')
    )
    return unsub
  }, [boatId, fromCloud, applyRemote, encrypt, toCloud])

  // Write a timestamped history snapshot (throttled) and prune to MAX_SNAPSHOTS.
  const writeHistorySnapshot = useCallback(async (payload) => {
    if (!configured || !db) return
    try {
      const histCol = collection(db, 'boats', boatId, 'history')
      const body = await toCloud(payload)
      await addDoc(histCol, { ...body, createdAt: Date.now() })
      const all = await getDocs(query(histCol, orderBy('createdAt', 'desc')))
      const docs = all.docs
      for (let i = MAX_SNAPSHOTS; i < docs.length; i++) {
        await deleteDoc(docs[i].ref)
      }
    } catch (e) { console.error('History snapshot failed:', e) }
  }, [boatId, toCloud])

  const maybeSnapshot = useCallback((payload) => {
    const now = Date.now()
    if (now - lastSnapshot.current < SNAPSHOT_INTERVAL_MS) return
    lastSnapshot.current = now
    writeHistorySnapshot(payload)
  }, [writeHistorySnapshot])

  // Debounced push — skips if offline (tracks dirty state instead)
  const push = useCallback((inv, voy, maint, future, dSop, dItems, lockers, prov, provCats, lbls, prfs) => {
    if (!configured || !db || ignoreNext.current || pendingSync) return
    const payload = buildPayload(inv, voy, maint, future, dSop, dItems, lockers, prov, provCats, lbls, prfs)
    if (!navigator.onLine) {
      // Offline: queue the change so it can be resolved on reconnect. (Still
      // allowed before hydration — we can't overwrite the cloud while offline.)
      offlineDirty.current = true
      pendingData.current = payload
      return
    }
    // Online, but never push until we've seen the server's current state —
    // prevents a freshly loaded device from overwriting the cloud with empty
    // data before it has downloaded what's there.
    if (!hydrated.current) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      if (!navigator.onLine) {
        offlineDirty.current = true
        pendingData.current = payload
        return
      }
      // Re-check guards at fire time: a remote snapshot may have arrived during
      // the debounce window, in which case this push is stale and would clobber.
      if (ignoreNext.current || !hydrated.current) return
      setStatus('syncing')
      try {
        const body = await toCloud(payload)
        await setDoc(doc(db, 'boats', boatId), { ...body, deviceId: DEVICE_ID, updatedAt: Date.now() })
        setStatus('synced')
        maybeSnapshot(payload)
      } catch (e) { console.error('Firestore push failed:', e); setStatus('offline') }
    }, 1500)
  }, [boatId, pendingSync, maybeSnapshot, toCloud])

  // Called from App when user responds to the reconnect dialog
  const resolveSync = useCallback(async (keepLocal) => {
    setPendingSync(false)
    offlineDirty.current = false
    if (keepLocal && pendingData.current) {
      const payload = pendingData.current
      setStatus('syncing')
      try {
        const body = await toCloud(payload)
        await setDoc(doc(db, 'boats', boatId), { ...body, deviceId: DEVICE_ID, updatedAt: Date.now() })
        setStatus('synced')
        maybeSnapshot(payload)
      } catch (e) { console.error('Firestore resolveSync failed:', e); setStatus('offline') }
    } else {
      setStatus('connecting')
      try {
        const snap = await getDoc(doc(db, 'boats', boatId))
        if (snap.exists()) {
          const payload = await fromCloud(snap.data())
          ignoreNext.current = true
          applyRemote(payload)
          setTimeout(() => { ignoreNext.current = false }, 1000)
        }
        setStatus('synced')
      } catch { setStatus('offline') }
    }
    pendingData.current = null
  }, [boatId, toCloud, fromCloud, applyRemote, maybeSnapshot])

  // List recent cloud history snapshots (newest first): [{ id, createdAt }]
  const listSnapshots = useCallback(async () => {
    if (!configured || !db) return []
    try {
      const histCol = collection(db, 'boats', boatId, 'history')
      const all = await getDocs(query(histCol, orderBy('createdAt', 'desc')))
      return all.docs.map(d => ({ id: d.id, createdAt: d.data().createdAt }))
    } catch (e) { console.error('List snapshots failed:', e); return [] }
  }, [boatId])

  // Restore a history snapshot: apply locally AND make it the current cloud doc.
  const restoreSnapshot = useCallback(async (id) => {
    if (!configured || !db) return false
    try {
      const snap = await getDoc(doc(db, 'boats', boatId, 'history', id))
      if (!snap.exists()) return false
      const payload = await fromCloud(snap.data())
      ignoreNext.current = true
      applyRemote(payload)
      const body = await toCloud(payload)
      await setDoc(doc(db, 'boats', boatId), { ...body, deviceId: DEVICE_ID, updatedAt: Date.now() })
      setTimeout(() => { ignoreNext.current = false }, 1500)
      return true
    } catch (e) { console.error('Restore snapshot failed:', e); return false }
  }, [boatId, fromCloud, applyRemote, toCloud])

  return { status, boatId, push, pendingSync, resolveSync, listSnapshots, restoreSnapshot }
}
