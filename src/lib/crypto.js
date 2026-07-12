/**
 * crypto.js — offline-capable authentication + encryption primitives.
 *
 * Model (envelope encryption):
 *   - Each boat has ONE random Data Encryption Key (DEK, AES-GCM 256).
 *   - The DEK encrypts all boat data (the "vault").
 *   - Each user's password is stretched with PBKDF2 into a Key-Encryption-Key
 *     (KEK). The DEK is wrapped (encrypted) with that KEK and stored on the
 *     device. Logging in = derive KEK from the typed password and try to unwrap
 *     the DEK; if it decrypts, the password was correct — all verified locally,
 *     no server, works fully offline.
 *   - A one-time Recovery Code wraps a second copy of the DEK, so a forgotten
 *     password never means permanent lockout.
 *
 * Uses only the platform WebCrypto API (globalThis.crypto.subtle) — no custom
 * cryptography.
 */

const subtle = globalThis.crypto.subtle
const PBKDF2_ITERATIONS = 210_000 // OWASP-recommended floor for PBKDF2-SHA256
const enc = new TextEncoder()
const dec = new TextDecoder()

// ── base64 helpers ─────────────────────────────────────────
export function bufToB64(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export function b64ToBuf(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

function randomBytes(n) {
  return globalThis.crypto.getRandomValues(new Uint8Array(n))
}

// ── password → KEK ─────────────────────────────────────────
export async function deriveKEK(password, saltB64, iterations = PBKDF2_ITERATIONS) {
  const baseKey = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(b64ToBuf(saltB64)), iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt'],
  )
}

// ── DEK (data encryption key) ──────────────────────────────
export function newSaltB64() {
  return bufToB64(randomBytes(16))
}

export async function generateDEK() {
  return subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

// Wrap the DEK with a KEK. Returns { iv, ct } (base64).
export async function wrapDEK(dek, kek) {
  const iv = randomBytes(12)
  const wrapped = await subtle.wrapKey('raw', dek, kek, { name: 'AES-GCM', iv })
  return { iv: bufToB64(iv), ct: bufToB64(wrapped) }
}

// Unwrap the DEK with a KEK. Throws if the KEK (password) is wrong.
export async function unwrapDEK({ iv, ct }, kek) {
  return subtle.unwrapKey(
    'raw',
    b64ToBuf(ct),
    kek,
    { name: 'AES-GCM', iv: new Uint8Array(b64ToBuf(iv)) },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
}

// ── data encryption with the DEK ───────────────────────────
export async function encryptJSON(obj, dek) {
  const iv = randomBytes(12)
  const data = enc.encode(JSON.stringify(obj))
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, dek, data)
  return { iv: bufToB64(iv), ct: bufToB64(ct) }
}

export async function decryptJSON({ iv, ct }, dek) {
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(b64ToBuf(iv)) }, dek, b64ToBuf(ct))
  return JSON.parse(dec.decode(pt))
}

// Import raw key bytes (e.g. a WebAuthn PRF output) as an AES-GCM key.
export async function importAesKeyRaw(raw, usages = ['wrapKey', 'unwrapKey']) {
  return subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usages)
}

// Export/import a DEK as base64 (for cloud escrow in the convenience model).
export async function exportKeyB64(key) {
  return bufToB64(await subtle.exportKey('raw', key))
}
export async function importKeyB64(b64) {
  return subtle.importKey('raw', new Uint8Array(b64ToBuf(b64)), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}

// ── recovery code ──────────────────────────────────────────
// Human-friendly, unambiguous alphabet (no 0/O/1/I), grouped for readability.
const RC_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateRecoveryCode() {
  const bytes = randomBytes(20)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    if (i > 0 && i % 4 === 0) out += '-'
    out += RC_ALPHABET[bytes[i] % RC_ALPHABET.length]
  }
  return out // e.g. WXQ7-2K9M-...-....
}

// Normalize user-typed recovery/transfer codes (strip spaces/dashes, uppercase).
export function normalizeRecoveryCode(code) {
  return (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Shorter one-time code for device-to-device linking, e.g. WXQ7-2K9M.
export function generateTransferCode() {
  const bytes = randomBytes(8)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    if (i === 4) out += '-'
    out += RC_ALPHABET[bytes[i] % RC_ALPHABET.length]
  }
  return out
}

export { PBKDF2_ITERATIONS }
