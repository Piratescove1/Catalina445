// Cross-device sync for maintenance receipt files via Firebase Storage.
//
// Receipt bytes are too large for the 1 MB per-boat Firestore doc, so they live
// in Firebase Storage at receipts/{boatId}/{receiptId}. The maintenance entry
// still only carries lightweight metadata (synced via Firestore); this module
// moves the actual bytes.
//
// Offline-first: uploads that can't complete (no signal) are queued in
// localStorage and retried on reconnect / next app open. Downloads happen on
// demand when a device needs bytes it doesn't have locally, and are cached in
// IndexedDB so they're then available offline.
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage, configured } from './firebase'
import { getReceipt, saveReceipt } from './receipts'

const QUEUE_KEY = 'c445-receipt-uploads'
const BOAT_ID_KEY = 'c445-boat-id'

function currentBoatId() {
  return localStorage.getItem(BOAT_ID_KEY) || ''
}

function pathFor(boatId, id) {
  return `receipts/${boatId}/${id}`
}

// ── upload queue (persisted so it survives reloads) ──────────
function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [] } catch { return [] }
}
function saveQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) } catch { /* ignore */ }
}
function enqueue(boatId, id) {
  const q = loadQueue()
  if (!q.some(e => e.boatId === boatId && e.id === id)) {
    q.push({ boatId, id })
    saveQueue(q)
  }
}
function dequeue(boatId, id) {
  saveQueue(loadQueue().filter(e => !(e.boatId === boatId && e.id === id)))
}

export function available() {
  return configured && !!storage
}

// Queue a receipt for upload and immediately try to flush.
export async function uploadReceipt(id) {
  if (!available()) return
  const boatId = currentBoatId()
  if (!boatId) return
  enqueue(boatId, id)
  await flushUploads()
}

// Try to upload everything queued. Silently leaves items queued on failure
// (e.g. offline) so they retry later.
let flushing = false
export async function flushUploads() {
  if (!available() || flushing) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  flushing = true
  try {
    for (const entry of loadQueue()) {
      try {
        const rec = await getReceipt(entry.id)
        if (!rec?.dataURL) { dequeue(entry.boatId, entry.id); continue } // gone locally
        await uploadString(ref(storage, pathFor(entry.boatId, entry.id)), rec.dataURL, 'data_url')
        dequeue(entry.boatId, entry.id)
      } catch {
        // Network/permission error — keep it queued and stop; retry next time.
        break
      }
    }
  } finally {
    flushing = false
  }
}

// Fetch a receipt's bytes from the cloud, cache locally, and return the dataURL.
// Returns null if unavailable (offline, not uploaded yet, or missing).
export async function fetchReceipt(meta) {
  if (!available()) return null
  const boatId = currentBoatId()
  if (!boatId) return null
  try {
    const url = await getDownloadURL(ref(storage, pathFor(boatId, meta.id)))
    const resp = await fetch(url)
    const blob = await resp.blob()
    const dataURL = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => reject(r.error)
      r.readAsDataURL(blob)
    })
    await saveReceipt({ id: meta.id, entryId: meta.entryId, name: meta.name, type: meta.type, dataURL, addedAt: meta.addedAt })
    return dataURL
  } catch {
    return null
  }
}

// Remove a receipt from the cloud (and drop any pending upload for it).
export async function deleteRemoteReceipt(id) {
  const boatId = currentBoatId()
  if (boatId) dequeue(boatId, id)
  if (!available() || !boatId) return
  try { await deleteObject(ref(storage, pathFor(boatId, id))) } catch { /* already gone / offline */ }
}
