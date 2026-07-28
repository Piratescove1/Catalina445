// Cross-device sync for maintenance receipt files via Firestore (free Spark
// plan — no Cloud Storage / billing needed).
//
// Receipt bytes are too large for the shared 1 MB per-boat doc, so each receipt
// gets its OWN document at boats/{boatId}/receipts/{receiptId} (also 1 MB max).
// The maintenance entry still carries only lightweight metadata; this module
// moves the actual bytes. Images are pre-compressed to fit; a rare oversized
// PDF that won't fit in a doc stays device-local.
//
// Offline-first: uploads that can't complete are queued in localStorage and
// retried on reconnect / next app open. Downloads happen on demand and are
// cached in IndexedDB so they're then available offline.
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { db, configured } from './firebase'
import { getReceipt, saveReceipt } from './receipts'

const QUEUE_KEY = 'c445-receipt-uploads'
const SYNCED_KEY = 'c445-receipts-synced' // ids already pushed to the cloud (per boat)
const BOAT_ID_KEY = 'c445-boat-id'
// Keep well under Firestore's 1,048,576-byte doc limit (leave room for the
// other fields + overhead). A receipt whose data URL exceeds this stays local.
const MAX_DOC_CHARS = 1_000_000

function currentBoatId() {
  return localStorage.getItem(BOAT_ID_KEY) || ''
}

function receiptDoc(boatId, id) {
  return doc(db, 'boats', boatId, 'receipts', id)
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

// ── "already uploaded" set (avoids re-uploading on every open) ──
function syncedKey(boatId, id) { return `${boatId}:${id}` }
function loadSynced() {
  try { return new Set(JSON.parse(localStorage.getItem(SYNCED_KEY)) || []) } catch { return new Set() }
}
function markSynced(boatId, id) {
  const s = loadSynced()
  s.add(syncedKey(boatId, id))
  try { localStorage.setItem(SYNCED_KEY, JSON.stringify([...s])) } catch { /* ignore */ }
}
function isSynced(boatId, id) {
  return loadSynced().has(syncedKey(boatId, id))
}

export function available() {
  return configured && !!db
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
        if (!rec?.dataURL) { dequeue(entry.boatId, entry.id); continue }        // gone locally
        if (rec.dataURL.length > MAX_DOC_CHARS) { dequeue(entry.boatId, entry.id); continue } // too big to sync; stays local
        await setDoc(receiptDoc(entry.boatId, entry.id), {
          id: rec.id, entryId: rec.entryId, name: rec.name,
          type: rec.type, dataURL: rec.dataURL, addedAt: rec.addedAt,
        })
        markSynced(entry.boatId, entry.id)
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

// Back-fill: upload any of the given receipt ids that live on this device but
// haven't been pushed to the cloud yet (e.g. added before sync existed). Only
// receipts whose bytes are actually here get uploaded; others are skipped.
// `ids` should be the CURRENT boat's receipt ids so multi-boat stays correct.
export async function backfillReceipts(ids) {
  if (!available() || !ids?.length) return
  const boatId = currentBoatId()
  if (!boatId) return
  let queuedAny = false
  for (const id of ids) {
    if (isSynced(boatId, id)) continue
    const rec = await getReceipt(id).catch(() => null)
    if (!rec?.dataURL) continue                          // bytes aren't on this device
    if (rec.dataURL.length > MAX_DOC_CHARS) continue     // too big to sync; stays local
    enqueue(boatId, id)
    queuedAny = true
  }
  if (queuedAny) await flushUploads()
}

// Fetch a receipt's bytes from the cloud, cache locally, and return the dataURL.
// Returns null if unavailable (offline, not uploaded yet, or missing).
export async function fetchReceipt(meta) {
  if (!available()) return null
  const boatId = currentBoatId()
  if (!boatId) return null
  try {
    const snap = await getDoc(receiptDoc(boatId, meta.id))
    if (!snap.exists()) return null
    const data = snap.data()
    if (!data?.dataURL) return null
    await saveReceipt({
      id: meta.id, entryId: data.entryId ?? meta.entryId, name: data.name ?? meta.name,
      type: data.type ?? meta.type, dataURL: data.dataURL, addedAt: data.addedAt ?? meta.addedAt,
    })
    return data.dataURL
  } catch {
    return null
  }
}

// Remove a receipt from the cloud (and drop any pending upload for it).
export async function deleteRemoteReceipt(id) {
  const boatId = currentBoatId()
  if (boatId) dequeue(boatId, id)
  if (!available() || !boatId) return
  try { await deleteDoc(receiptDoc(boatId, id)) } catch { /* already gone / offline */ }
}
