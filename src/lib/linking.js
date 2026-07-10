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
