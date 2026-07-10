/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import * as vault from '../lib/vault'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('locked')       // 'locked' | 'unlocked'
  const [account, setAccount] = useState(null)         // { username, displayName, role }
  const [firstRun, setFirstRun] = useState(() => !vault.hasAccounts())
  const [pendingRecovery, setPendingRecovery] = useState(null) // recovery code to show once
  const [mustReset, setMustReset] = useState(false)    // after recovery, force a new password
  const dekRef = useRef(null)

  // On load, if accounts already exist we're locked: wipe any plaintext left in
  // localStorage from a previous session so nothing readable sits at rest.
  useEffect(() => {
    if (vault.hasAccounts()) vault.clearLocalData()
  }, [])

  // Leave only ciphertext behind when the tab/app is closed.
  useEffect(() => {
    const onUnload = () => { if (dekRef.current) vault.clearLocalData() }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  const signup = useCallback(async (username, password) => {
    const { dek, recoveryCode, account } = await vault.createFirstAccount({ username, password })
    dekRef.current = dek
    setAccount(account)
    setFirstRun(false)
    setPendingRecovery(recoveryCode) // stay locked until the code is acknowledged
  }, [])

  const login = useCallback(async (username, password) => {
    const { dek, account } = await vault.login({ username, password })
    await vault.openVault(dek)
    dekRef.current = dek
    setAccount(account)
    setStatus('unlocked')
  }, [])

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

  const logout = useCallback(() => {
    vault.clearLocalData()
    dekRef.current = null
    setAccount(null)
    setStatus('locked')
  }, [])

  const value = {
    status, account, firstRun, pendingRecovery, mustReset,
    signup, login, recover, submitReset, confirmRecovery, persist, logout,
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
