/**
 * cloudAccount.js — optional cloud login/recovery (Firebase Auth).
 *
 * Purpose: survive a wiped/new device. The local-first login still works
 * offline; this adds a durable server identity so a fresh device can log in
 * online and get its boat + key back.
 *
 * Privacy: we escrow the boat key (DEK) WRAPPED BY THE USER'S PASSWORD in
 * users/{uid}. The server stores only ciphertext + the Firebase Auth hash, so
 * it can't read the DEK or the data. The password does double duty: it
 * authenticates to Firebase AND derives the client-side key that unwraps the DEK.
 *
 * Requires (Firebase console): Email/Password provider enabled, and a Firestore
 * rule allowing each user to read/write only users/{their uid}.
 */
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, configured } from './firebase.js'
import { deriveKEK, unwrapDEK, exportKeyB64, importKeyB64 } from './crypto.js'

export function cloudReady() {
  return !!(configured && auth && db)
}

function mapError(e) {
  const code = e?.code || ''
  if (code === 'auth/operation-not-allowed') return new Error('auth-not-enabled')
  if (code === 'auth/email-already-in-use') return new Error('email-in-use')
  if (code === 'auth/invalid-email') return new Error('bad-email')
  if (code === 'auth/weak-password') return new Error('weak-password')
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return new Error('bad-login')
  if (code === 'auth/network-request-failed') return new Error('offline')
  return e
}

export async function sendPasswordReset(email) {
  if (!cloudReady()) throw new Error('offline')
  try {
    await sendPasswordResetEmail(auth, (email || '').trim())
  } catch (e) {
    throw mapError(e)
  }
}

// Enable cloud backup for the current boat: create the Firebase account and
// escrow the DEK wrapped by the password. Requires connectivity.
export async function enableCloudBackup({ email, password, dek, boatId }) {
  if (!cloudReady()) throw new Error('offline')
  let cred
  try {
    cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
  } catch (e) {
    throw mapError(e)
  }
  const uid = cred.user.uid
  await setDoc(doc(db, 'users', uid), {
    email: email.trim().toLowerCase(),
    boatId: boatId || '',
    dek: await exportKeyB64(dek), // recoverable after any successful login (convenience model)
    updatedAt: Date.now(),
  })
  return { uid }
}

// Restore on a new/wiped device: sign in, fetch the escrow, unwrap the DEK.
export async function cloudRestore({ email, password }) {
  if (!cloudReady()) throw new Error('offline')
  let cred
  try {
    cred = await signInWithEmailAndPassword(auth, email.trim(), password)
  } catch (e) {
    throw mapError(e)
  }
  const uid = cred.user.uid
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) throw new Error('no-backup')
  const data = snap.data()
  let dek
  try {
    if (data.dek) {
      dek = await importKeyB64(data.dek)
    } else if (data.wrappedDEK && data.salt) {
      // Legacy escrow (password-wrapped). Unwrap, then upgrade to the
      // recoverable form so future password resets restore data too.
      const kek = await deriveKEK(password, data.salt)
      dek = await unwrapDEK(data.wrappedDEK, kek)
      try {
        await setDoc(doc(db, 'users', uid), {
          email: (data.email || email).trim().toLowerCase(),
          boatId: data.boatId || '',
          dek: await exportKeyB64(dek),
          updatedAt: Date.now(),
        })
      } catch { /* best effort */ }
    } else {
      throw new Error('no-key')
    }
  } catch {
    throw new Error('bad-login')
  }
  return { dek, boatId: data.boatId || '', email: (data.email || email).trim() }
}

export async function cloudSignOut() {
  try { if (auth) await fbSignOut(auth) } catch { /* ignore */ }
}
