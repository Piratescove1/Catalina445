/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import * as vault from '../lib/vault'
import * as bio from '../lib/biometric'
import * as linking from '../lib/linking'
import * as cloud from '../lib/cloudAccount'
import { getBoatId } from '../hooks/useSync'
import { encryptJSON, decryptJSON, generateDEK } from '../lib/crypto'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('locked')       // 'locked' | 'unlocked'
  const [account, setAccount] = useState(null)         // { username, displayName, role }
  const [firstRun, setFirstRun] = useState(() => !vault.hasAccounts())
  const [pendingRecovery, setPendingRecovery] = useState(null) // recovery code to show once
  const [mustReset, setMustReset] = useState(false)    // after recovery, force a new password
  const [bioAvailable, setBioAvailable] = useState(false)   // device has Face ID / fingerprint
  const [canBioUnlock, setCanBioUnlock] = useState(false)   // enrolled for the last user
  const [bioOn, setBioOn] = useState(false)                 // enabled for the current account
  const [lastUser, setLastUser] = useState(() => bio.getLastUser())
  const [cloudEmail, setCloudEmail] = useState(() => localStorage.getItem('c445-cloud-email') || '')
  const dekRef = useRef(null)

  // On load, if accounts already exist we're locked: wipe any plaintext left in
  // localStorage from a previous session so nothing readable sits at rest.
  useEffect(() => {
    if (vault.hasAccounts()) vault.clearLocalData()
  }, [])

  // Detect biometric availability + whether the last user enrolled.
  useEffect(() => {
    bio.isAvailable().then(ok => {
      setBioAvailable(ok)
      setCanBioUnlock(ok && bio.isEnabled(bio.getLastUser()))
    })
  }, [])

  // Leave only ciphertext behind when the tab/app is closed.
  useEffect(() => {
    const onUnload = () => { if (dekRef.current) vault.clearLocalData() }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  const rememberUser = useCallback((username) => {
    bio.setLastUser(username)
    setLastUser(username)
  }, [])

  // Sign up = create the CLOUD account first (so recovery is always set up),
  // then the local account with the same key. Requires connectivity.
  const signup = useCallback(async (email, password) => {
    const em = (email || '').trim()
    const dek = await generateDEK()
    const boatId = getBoatId()
    await cloud.enableCloudBackup({ email: em, password, dek, boatId }) // throws if offline / provider off / email in use
    const { recoveryCode, account } = await vault.createFirstAccountWithKey({ username: em, password, dek })
    dekRef.current = dek
    setAccount(account)
    rememberUser(account.username)
    localStorage.setItem('c445-cloud-email', em)
    setCloudEmail(em)
    setBioOn(false)
    setFirstRun(false)
    setPendingRecovery(recoveryCode) // stay locked until the code is acknowledged
  }, [rememberUser])

  const login = useCallback(async (username, password) => {
    const { dek, account } = await vault.login({ username, password })
    await vault.openVault(dek)
    dekRef.current = dek
    setAccount(account)
    rememberUser(account.username)
    setBioOn(bio.isEnabled(account.username))
    setStatus('unlocked')
  }, [rememberUser])

  // Unlock with Face ID / fingerprint (returns the DEK via the passkey PRF).
  const unlockBiometric = useCallback(async () => {
    const u = lastUser || bio.getLastUser()
    const dek = await bio.unlock(u)
    await vault.openVault(dek)
    dekRef.current = dek
    setAccount(vault.getAccount(u))
    setBioOn(true)
    setStatus('unlocked')
  }, [lastUser])

  const enableBiometric = useCallback(async () => {
    if (!account || !dekRef.current) throw new Error('locked')
    await bio.register(account.username, dekRef.current)
    rememberUser(account.username)
    setBioOn(true)
    setCanBioUnlock(true)
  }, [account, rememberUser])

  const disableBiometric = useCallback(() => {
    if (account) bio.disable(account.username)
    setBioOn(false)
    setCanBioUnlock(bio.isEnabled(bio.getLastUser()))
  }, [account])

  const recover = useCallback(async (username, recoveryCode) => {
    const { dek, account } = await vault.recover({ username, recoveryCode })
    await vault.openVault(dek)
    dekRef.current = dek
    setAccount(account)
    setMustReset(true) // force setting a new password before entering
  }, [])

  const submitReset = useCallback(async (newPassword) => {
    const { recoveryCode } = await vault.resetPassword({
      username: account.username, newPassword, dek: dekRef.current,
    })
    setMustReset(false)
    setPendingRecovery(recoveryCode)
  }, [account])

  const confirmRecovery = useCallback(() => {
    setPendingRecovery(null)
    setStatus('unlocked')
  }, [])

  const persist = useCallback(async () => {
    if (dekRef.current) await vault.writeVault(dekRef.current)
  }, [])

  // Encrypt/decrypt helpers bound to the in-memory boat key, for cloud sync.
  const encryptData = useCallback(async (obj) => {
    if (!dekRef.current) throw new Error('locked')
    return encryptJSON(obj, dekRef.current)
  }, [])
  const decryptData = useCallback(async (blob) => {
    if (!dekRef.current) throw new Error('locked')
    return decryptJSON(blob, dekRef.current)
  }, [])

  // ── Device linking (Phase 3): share one boat key across devices ──
  const createDeviceLink = useCallback(async () => {
    if (!dekRef.current) throw new Error('locked')
    const boatId = localStorage.getItem('c445-boat-id') || ''
    return linking.createLinkBundle(dekRef.current, boatId) // { code, bundle }
  }, [])

  // Adopt a shared key onto this device (shared logic for QR and typing code).
  const adoptSharedKey = useCallback(async ({ dek, boatId, password }) => {
    const { recoveryCode } = await vault.changeBoatKey({ username: account.username, password, newDek: dek })
    if (boatId) localStorage.setItem('c445-boat-id', boatId)
    dekRef.current = dek
    await vault.writeVault(dek)        // re-encrypt local vault with the shared key
    bio.disable(account.username)      // old Face ID enrolment wrapped the old key
    setBioOn(false)
    return recoveryCode                // caller shows it, then reloads
  }, [account])

  // QR / paste path.
  const linkThisDevice = useCallback(async ({ bundle, code, password }) => {
    if (!account) throw new Error('locked')
    const { dek, boatId } = await linking.redeemLinkBundle(bundle, code)
    return adoptSharedKey({ dek, boatId, password })
  }, [account, adoptSharedKey])

  // Typing-code path (needs internet): source parks the key in the cloud.
  const startPairingLink = useCallback(async () => {
    if (!dekRef.current) throw new Error('locked')
    const boatId = localStorage.getItem('c445-boat-id') || ''
    return linking.startPairing(dekRef.current, boatId) // returns the short code
  }, [])

  const linkWithCode = useCallback(async ({ code, password }) => {
    if (!account) throw new Error('locked')
    const { dek, boatId } = await linking.redeemPairing(code)
    return adoptSharedKey({ dek, boatId, password })
  }, [account, adoptSharedKey])

  // ── Cloud login / recovery (Firebase Auth) ──
  const enableCloud = useCallback(async (email, password) => {
    if (!account || !dekRef.current) throw new Error('locked')
    await vault.login({ username: account.username, password }) // verify device password
    const boatId = localStorage.getItem('c445-boat-id') || ''
    await cloud.enableCloudBackup({ email, password, dek: dekRef.current, boatId })
    localStorage.setItem('c445-cloud-email', email.trim())
    setCloudEmail(email.trim())
  }, [account])

  // Restore this (new/wiped) device from the cloud account.
  const cloudRestore = useCallback(async (email, password) => {
    const { dek, boatId, email: em } = await cloud.cloudRestore({ email, password })
    if (boatId) localStorage.setItem('c445-boat-id', boatId)
    await vault.createAccountFromKey({ username: em, password, dek })
    dekRef.current = dek
    setAccount(vault.getAccount(em))
    rememberUser((em || '').toLowerCase())
    localStorage.setItem('c445-cloud-email', em)
    setCloudEmail(em)
    setBioOn(false)
    setStatus('unlocked')
  }, [rememberUser])

  const logout = useCallback(() => {
    vault.clearLocalData()
    dekRef.current = null
    setAccount(null)
    setBioOn(false)
    setStatus('locked')
  }, [])

  const value = {
    status, account, firstRun, pendingRecovery, mustReset,
    bioAvailable, canBioUnlock, bioOn, lastUser,
    signup, login, recover, submitReset, confirmRecovery, persist, logout,
    unlockBiometric, enableBiometric, disableBiometric,
    encryptData, decryptData,
    createDeviceLink, linkThisDevice, startPairingLink, linkWithCode,
    cloudReady: cloud.cloudReady(), cloudEmail, enableCloud, cloudRestore,
    sendPasswordReset: cloud.sendPasswordReset,
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
