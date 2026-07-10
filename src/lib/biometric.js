/**
 * biometric.js — Face ID / Touch ID quick-unlock via WebAuthn + the PRF
 * extension.
 *
 * On enrollment we create a platform passkey and use its PRF output as a secret
 * to WRAP the boat data key (DEK). The secret is derived from the biometric and
 * is never stored, so the wrapped DEK on disk is useless without a successful
 * Face ID / fingerprint check. If the device/browser can't do PRF we refuse to
 * enroll (rather than fall back to something insecure) — the password login
 * always remains available.
 */
import { bufToB64, b64ToBuf, wrapDEK, unwrapDEK, importAesKeyRaw } from './crypto.js'

const CFG_KEY = 'c445-biometric'
const LAST_USER_KEY = 'c445-last-user'
const RP_NAME = 'Catalina 445'

const lower = (u) => (u || '').trim().toLowerCase()
const rand = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n))

function loadCfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {} } catch { return {} } }
function saveCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)) }

export function isEnabled(username) { return !!loadCfg()[lower(username)] }
export function disable(username) { const c = loadCfg(); delete c[lower(username)]; saveCfg(c) }
export function setLastUser(username) { localStorage.setItem(LAST_USER_KEY, username || '') }
export function getLastUser() { return localStorage.getItem(LAST_USER_KEY) || '' }

// Is a platform authenticator (Face ID / Touch ID / fingerprint) present?
export async function isAvailable() {
  try {
    if (!window.PublicKeyCredential) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch { return false }
}

// Enroll the current account for biometric unlock. Requires the DEK (available
// while unlocked). Throws 'prf-unsupported' if the device can't derive a key.
export async function register(username, dek) {
  const prfSalt = rand(32)
  const cred = await navigator.credentials.create({
    publicKey: {
      rp: { name: RP_NAME },
      user: { id: rand(16), name: username, displayName: username },
      challenge: rand(32),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        userVerification: 'required',
      },
      extensions: { prf: { eval: { first: prfSalt } } },
      timeout: 60000,
    },
  })
  if (!cred) throw new Error('biometric-cancelled')

  const ext = cred.getClientExtensionResults?.() || {}
  let prf = ext.prf?.results?.first
  // Some platforms only evaluate PRF during an assertion, not at creation.
  if (!prf && ext.prf?.enabled) {
    const asrt = await navigator.credentials.get({
      publicKey: {
        challenge: rand(32),
        allowCredentials: [{ type: 'public-key', id: new Uint8Array(cred.rawId) }],
        userVerification: 'required',
        extensions: { prf: { eval: { first: prfSalt } } },
        timeout: 60000,
      },
    })
    prf = asrt?.getClientExtensionResults?.()?.prf?.results?.first
  }
  if (!prf) throw new Error('prf-unsupported')

  const key = await importAesKeyRaw(prf, ['wrapKey', 'unwrapKey'])
  const wrappedDEK = await wrapDEK(dek, key)
  const cfg = loadCfg()
  cfg[lower(username)] = { credentialId: bufToB64(cred.rawId), prfSalt: bufToB64(prfSalt), wrappedDEK }
  saveCfg(cfg)
  return true
}

// Unlock with biometrics. Returns the DEK. Throws on cancel/failure.
export async function unlock(username) {
  const cfg = loadCfg()[lower(username)]
  if (!cfg) throw new Error('not-enrolled')
  const asrt = await navigator.credentials.get({
    publicKey: {
      challenge: rand(32),
      allowCredentials: [{ type: 'public-key', id: new Uint8Array(b64ToBuf(cfg.credentialId)) }],
      userVerification: 'required',
      extensions: { prf: { eval: { first: new Uint8Array(b64ToBuf(cfg.prfSalt)) } } },
      timeout: 60000,
    },
  })
  if (!asrt) throw new Error('biometric-cancelled')
  const prf = asrt.getClientExtensionResults?.()?.prf?.results?.first
  if (!prf) throw new Error('prf-unavailable')
  const key = await importAesKeyRaw(prf, ['wrapKey', 'unwrapKey'])
  return unwrapDEK(cfg.wrappedDEK, key)
}
