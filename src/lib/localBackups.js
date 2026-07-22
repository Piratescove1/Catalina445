// Automatic on-device backups, stored in IndexedDB (bigger + safer than
// localStorage for full snapshots that may include boat drawings). Each record:
// { id: 'YYYY-MM-DD', createdAt: ms, backup: { _app, _version, exportedAt, keys } }
const DB_NAME = 'c445-local-backups'
const STORE = 'snaps'

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no-idb')); return }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveLocalBackup(rec) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(rec)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function listLocalBackups() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).getAll()
    r.onsuccess = () => resolve((r.result || []).sort((a, b) => b.createdAt - a.createdAt))
    r.onerror = () => reject(r.error)
  })
}

export async function getLocalBackup(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(id)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

export async function deleteLocalBackup(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function pruneLocalBackups(keep) {
  const all = await listLocalBackups()
  for (let i = keep; i < all.length; i++) await deleteLocalBackup(all[i].id)
}
