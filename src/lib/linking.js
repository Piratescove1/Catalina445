/**
 * linking.js — device-to-device sharing of the boat key (Phase 3).
 *
 * The source device (which holds the boat DEK) creates a small bundle: the DEK
 * + boat id, encrypted with a one-time transfer code. The bundle travels by any
 * offline channel (AirDrop, copy/paste, hotspot). The target device enters the
 * transfer code to unwrap the shared DEK, then re-wraps it under its own account
 * password (see vault.changeBoatKey). Result: all devices share one boat key, so
 * end-to-end cloud encryption works across devices.
 *
 * The bundle carries only the key + boat id (tiny) — the actual data syncs
 * normally, or transfers via JSON backup/restore for a brand-new offline device.
 */
import {
  deriveKEK, newSaltB64, wrapDEK, unwrapDEK, generateTransferCode, normalizeRecoveryCode,
} from './crypto.js'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { db, configured } from './firebase.js'

const PAIRING_TTL_MS = 15 * 60 * 1000 // typing codes expire after 15 minutes

export async function createLinkBundle(dek, boatId) {
  const code = generateTransferCode()
  const salt = newSaltB64()
  const kek = await deriveKEK(normalizeRecoveryCode(code), salt)
  const wrappedDEK = await wrapDEK(dek, kek)
  const bundle = btoa(JSON.stringify({ v: 1, boatId: boatId || '', salt, wrappedDEK }))
  return { code, bundle }
}

export async function redeemLinkBundle(bundleText, code) {
  let obj
  try {
    obj = JSON.parse(atob((bundleText || '').trim()))
  } catch {
    throw new Error('bad-bundle')
  }
  if (!obj || !obj.wrappedDEK || !obj.salt) throw new Error('bad-bundle')
  const kek = await deriveKEK(normalizeRecoveryCode(code), obj.salt)
  let dek
  try {
    dek = await unwrapDEK(obj.wrappedDEK, kek)
  } catch {
    throw new Error('bad-code')
  }
  return { dek, boatId: obj.boatId || '' }
}

// ── Typing-code pairing (needs internet) ────────────────────
// The source parks the encrypted bundle in the cloud under a short code; the
// target types that code to fetch + decrypt it. One-time and short-lived.
// The pairing doc lives at boats/{CODE} (8 chars, so it can't collide with a
// real 6-char boat id), and is deleted after use.

export async function startPairing(dek, boatId) {
  if (!configured || !db) throw new Error('offline')
  const { code, bundle } = await createLinkBundle(dek, boatId)
  const id = normalizeRecoveryCode(code)
  await setDoc(doc(db, 'boats', id), { pairing: bundle, createdAt: Date.now() })
  return code
}

export async function redeemPairing(code) {
  if (!configured || !db) throw new Error('offline')
  const id = normalizeRecoveryCode(code)
  if (!id) throw new Error('pairing-not-found')
  const ref = doc(db, 'boats', id)
  const snap = await getDoc(ref)
  if (!snap.exists() || !snap.data().pairing) throw new Error('pairing-not-found')
  const data = snap.data()
  if (Date.now() - (data.createdAt || 0) > PAIRING_TTL_MS) {
    try { await deleteDoc(ref) } catch { /* ignore */ }
    throw new Error('pairing-expired')
  }
  const result = await redeemLinkBundle(data.pairing, code)
  try { await deleteDoc(ref) } catch { /* ignore */ }
  return result
}
