/**
 * vault.js — local-first account store and encrypted data vault.
 *
 * Accounts live in localStorage under ACCOUNTS_KEY. Each holds only a salted
 * password fingerprint and the boat key wrapped by that password (plus a
 * recovery-code-wrapped copy) — never the password or the raw key.
 *
 * All boat data (the DATA_KEYS below) is encrypted as one blob under VAULT_KEY
 * with the boat's Data Encryption Key (DEK). While the app is unlocked the
 * plaintext is written back into the normal localStorage keys so the existing
 * hooks work unchanged; on lock we wipe those, leaving only the encrypted vault.
 */
import {
  deriveKEK, newSaltB64, generateDEK, wrapDEK, unwrapDEK,
  encryptJSON, decryptJSON, generateRecoveryCode, normalizeRecoveryCode,
  PBKDF2_ITERATIONS,
} from './crypto.js'

const ACCOUNTS_KEY = 'c445-accounts'
const VAULT_KEY = 'c445-vault'

// The app-data keys that get encrypted into the vault.
export const DATA_KEYS = [
  'c445-inventory',
  'c445-voyages',
  'c445-locker-inventory',
  'c445-provisions',
  'c445-prov-categories',
  'c445-maintenance',
  'c445-future-projects',
  'c445-ditch-sop',
  'c445-ditch-items',
  'c445-prefs',
  'c445-labels',
  'c445-boat-id',
]

// ── account records ────────────────────────────────────────
export function loadAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [] } catch { return [] }
}
function saveAccounts(list) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list))
}
export function hasAccounts() {
  return loadAccounts().length > 0
}
function findAccount(username) {
  const u = (username || '').trim().toLowerCase()
  return loadAccounts().find(a => a.username === u) || null
}
export function accountExists(username) {
  return !!findAccount(username)
}
export function getAccount(username) {
  const a = findAccount(username)
  return a ? publicAccount(a) : null
}

// ── plaintext localStorage <-> object ──────────────────────
function snapshotLocalData() {
  const out = {}
  for (const k of DATA_KEYS) {
    const v = localStorage.getItem(k)
    if (v !== null) out[k] = v
  }
  return out
}
function writeLocalData(obj) {
  for (const k of DATA_KEYS) {
    if (obj && obj[k] != null) localStorage.setItem(k, obj[k])
    else localStorage.removeItem(k)
  }
}
export function clearLocalData() {
  for (const k of DATA_KEYS) localStorage.removeItem(k)
}

// ── vault (encrypted data blob) ────────────────────────────
export async function writeVault(dek) {
  const blob = await encryptJSON(snapshotLocalData(), dek)
  localStorage.setItem(VAULT_KEY, JSON.stringify(blob))
}
export async function openVault(dek) {
  const raw = localStorage.getItem(VAULT_KEY)
  if (!raw) return false
  const data = await decryptJSON(JSON.parse(raw), dek)
  writeLocalData(data)
  return true
}
export function hasVault() {
  return localStorage.getItem(VAULT_KEY) != null
}

// ── account lifecycle ──────────────────────────────────────

// Create the FIRST (admin) account: generates a fresh boat key and captures
// whatever data is already in localStorage into the vault (migration).
export async function createFirstAccount({ username, password }) {
  const dek = await generateDEK()
  const account = await buildAccountRecord({ username, password, dek, role: 'admin' })
  const recoveryCode = account._recoveryCode
  delete account._recoveryCode
  saveAccounts([account])
  await writeVault(dek) // migrate existing plaintext into the encrypted vault
  return { dek, recoveryCode, account: publicAccount(account) }
}

// Build a record wrapping the given DEK under a new password + recovery code.
async function buildAccountRecord({ username, password, dek, role }) {
  const salt = newSaltB64()
  const kek = await deriveKEK(password, salt)
  const wrappedDEK = await wrapDEK(dek, kek)

  const recoveryCode = generateRecoveryCode()
  const recoverySalt = newSaltB64()
  const recKek = await deriveKEK(normalizeRecoveryCode(recoveryCode), recoverySalt)
  const recWrapped = await wrapDEK(dek, recKek)

  return {
    username: username.trim().toLowerCase(),
    displayName: username.trim(),
    role: role || 'crew',
    iterations: PBKDF2_ITERATIONS,
    salt,
    wrappedDEK,
    recovery: { salt: recoverySalt, wrappedDEK: recWrapped },
    createdAt: Date.now(),
    _recoveryCode: recoveryCode,
  }
}

function publicAccount(a) {
  return { username: a.username, displayName: a.displayName, role: a.role }
}

// Log in: unwrap the DEK with the password. Throws if the password is wrong.
export async function login({ username, password }) {
  const account = findAccount(username)
  if (!account) throw new Error('no-such-user')
  const kek = await deriveKEK(password, account.salt, account.iterations)
  let dek
  try {
    dek = await unwrapDEK(account.wrappedDEK, kek)
  } catch {
    throw new Error('bad-password')
  }
  return { dek, account: publicAccount(account) }
}

// Recover with the one-time recovery code. Returns the DEK so the caller can
// immediately set a new password.
export async function recover({ username, recoveryCode }) {
  const account = findAccount(username)
  if (!account?.recovery) throw new Error('no-such-user')
  const kek = await deriveKEK(normalizeRecoveryCode(recoveryCode), account.recovery.salt, account.iterations)
  let dek
  try {
    dek = await unwrapDEK(account.recovery.wrappedDEK, kek)
  } catch {
    throw new Error('bad-recovery-code')
  }
  return { dek, account: publicAccount(account) }
}

// Re-wrap the DEK under a new password (and issue a fresh recovery code).
export async function resetPassword({ username, newPassword, dek }) {
  const list = loadAccounts()
  const idx = list.findIndex(a => a.username === (username || '').trim().toLowerCase())
  if (idx < 0) throw new Error('no-such-user')
  const rebuilt = await buildAccountRecord({
    username: list[idx].displayName || list[idx].username,
    password: newPassword,
    dek,
    role: list[idx].role,
  })
  rebuilt.createdAt = list[idx].createdAt
  const recoveryCode = rebuilt._recoveryCode
  delete rebuilt._recoveryCode
  list[idx] = rebuilt
  saveAccounts(list)
  return { recoveryCode }
}
