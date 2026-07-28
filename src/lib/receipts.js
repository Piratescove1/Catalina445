// Receipt images/PDFs for maintenance entries, stored in IndexedDB.
//
// Why not localStorage or the synced boat doc? Receipt files are large. The
// Firestore per-boat doc has a hard 1 MB limit and localStorage ~5 MB, so
// inlining receipt bytes there would break sync and the encrypted vault. Instead
// the bytes live device-local in IndexedDB; the maintenance entry keeps only
// lightweight metadata ({ id, name, type, addedAt }) which syncs + backs up.
//
// Record shape: { id, entryId, name, type: 'image'|'pdf', dataURL, addedAt }
import { fileToConstrainedDataURL } from './image'

const DB_NAME = 'c445-receipts'
const STORE = 'receipts'
const MAX_PDF_BYTES = 8 * 1024 * 1024 // reject huge PDFs before they fill storage

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no-idb')); return }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' })
        os.createIndex('entryId', 'entryId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    let result
    Promise.resolve(fn(store)).then(r => { result = r })
    t.oncomplete = () => resolve(result)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  }))
}

// Turn a picked File into a receipt payload { name, type, dataURL }.
// Images are downscaled + JPEG-compressed; PDFs stored as-is (size-capped).
export async function fileToReceipt(file) {
  if (!file) throw new Error('no-file')
  if (file.type?.startsWith('image/')) {
    // Constrain so the image fits in a single Firestore doc (cross-device sync).
    const dataURL = await fileToConstrainedDataURL(file)
    return { name: file.name || 'photo.jpg', type: 'image', dataURL }
  }
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF_BYTES) throw new Error('pdf-too-large')
    const dataURL = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => reject(r.error)
      r.readAsDataURL(file)
    })
    return { name: file.name || 'receipt.pdf', type: 'pdf', dataURL }
  }
  throw new Error('unsupported-type')
}

export async function saveReceipt(rec) {
  return tx('readwrite', store => store.put(rec))
}

export async function getReceipt(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const r = t.objectStore(STORE).get(id)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

export async function deleteReceipt(id) {
  return tx('readwrite', store => store.delete(id))
}

export async function deleteReceipts(ids) {
  if (!ids || !ids.length) return
  return tx('readwrite', store => { for (const id of ids) store.delete(id) })
}

// All receipt records (for full backups).
export async function allReceipts() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const r = t.objectStore(STORE).getAll()
    r.onsuccess = () => resolve(r.result || [])
    r.onerror = () => reject(r.error)
  })
}

// Restore receipt records from a backup (does not clear existing ones).
export async function bulkPutReceipts(list) {
  if (!list || !list.length) return
  return tx('readwrite', store => { for (const rec of list) if (rec && rec.id) store.put(rec) })
}
