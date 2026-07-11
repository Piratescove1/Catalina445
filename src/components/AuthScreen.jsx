import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const ERR = {
  'no-such-user': 'No account found with that username.',
  'bad-password': 'Incorrect password.',
  'bad-recovery-code': 'That recovery code is not correct.',
  'biometric-cancelled': 'Face ID was cancelled — enter your password.',
  'prf-unavailable': 'Face ID unlock isn’t available here — enter your password.',
  'not-enrolled': 'Face ID isn’t set up yet — log in with your password.',
  'auth-not-enabled': 'Cloud login isn’t switched on for this app yet.',
  'email-in-use': 'That email already has an account.',
  'bad-email': 'That doesn’t look like a valid email.',
  'weak-password': 'Password must be at least 6 characters.',
  'bad-login': 'Wrong email or password.',
  'no-backup': 'No cloud backup found for that account.',
  'offline': 'You need an internet connection for cloud login.',
}

const isEmail = (s) => /.+@.+\..+/.test((s || '').trim())

export default function AuthScreen() {
  const {
    firstRun, pendingRecovery, mustReset, signup, login, recover, submitReset, confirmRecovery,
    canBioUnlock, unlockBiometric, cloudReady, cloudRestore,
  } = useAuth()

  // 'login' | 'recover' — signup/reset/recovery are driven by context flags.
  const [mode, setMode] = useState(firstRun ? 'signup' : 'login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn) => {
    setError(''); setBusy(true)
    try { await fn() }
    catch (e) { setError(ERR[e.message] || 'Something went wrong. Please try again.') }
    finally { setBusy(false) }
  }

  // ── Recovery code display (after signup or password reset) ──
  if (pendingRecovery) {
    return (
      <AuthShell title="Save your recovery code">
        <p className="auth-note">
          This is the <strong>only</strong> way to get back in if you forget your password.
          Write it down and keep it somewhere safe — it won’t be shown again.
        </p>
        <div className="auth-reccode">{pendingRecovery}</div>
        <button className="auth-btn" onClick={confirmRecovery}>
          I’ve saved it — continue
        </button>
      </AuthShell>
    )
  }

  // ── Forced password reset after recovery ────────────────────
  if (mustReset) {
    return (
      <AuthShell title="Set a new password">
        <p className="auth-note">Recovery successful. Choose a new password for your account.</p>
        <input className="auth-input" type="password" placeholder="New password" value={password}
          onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        <input className="auth-input" type="password" placeholder="Confirm new password" value={confirm}
          onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-btn" disabled={busy || password.length < 6 || password !== confirm}
          onClick={() => run(() => submitReset(password))}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
        {password && password.length < 6 && <p className="auth-hint">Password must be at least 6 characters.</p>}
        {confirm && password !== confirm && <p className="auth-hint">Passwords don’t match.</p>}
      </AuthShell>
    )
  }

  // ── Recover: enter username + recovery code ─────────────────
  if (mode === 'recover') {
    return (
      <AuthShell title="Recover your account">
        <input className="auth-input" placeholder="Username" value={username}
          onChange={e => setUsername(e.target.value)} autoCapitalize="none" />
        <input className="auth-input" placeholder="Recovery code" value={code}
          onChange={e => setCode(e.target.value)} autoCapitalize="characters" />
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-btn" disabled={busy || !username || !code}
          onClick={() => run(() => recover(username, code))}>
          {busy ? 'Checking…' : 'Recover'}
        </button>
        <button className="auth-link" onClick={() => { setError(''); setMode('login') }}>← Back to log in</button>
      </AuthShell>
    )
  }

  // ── Sign up (first run) ─────────────────────────────────────
  if (mode === 'signup') {
    return (
      <AuthShell title="Create your account">
        <p className="auth-note">Your <strong>email</strong> is how you log back in on any device — so you can never
        lose access. Creating the account needs internet (do it at the dock); after that it works offline.</p>
        <input className="auth-input" type="email" placeholder="Email" value={username}
          onChange={e => setUsername(e.target.value)} autoCapitalize="none" inputMode="email" autoComplete="email" />
        <input className="auth-input" type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        <input className="auth-input" type="password" placeholder="Confirm password" value={confirm}
          onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-btn"
          disabled={busy || !isEmail(username) || password.length < 6 || password !== confirm}
          onClick={() => run(() => signup(username, password))}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        {username && !isEmail(username) && <p className="auth-hint">Enter a valid email address.</p>}
        {password && password.length < 6 && <p className="auth-hint">Password must be at least 6 characters.</p>}
        {confirm && password !== confirm && <p className="auth-hint">Passwords don’t match.</p>}
        {cloudReady && (
          <button className="auth-link" onClick={() => { setError(''); setMode('cloudRestore') }}>
            Already set up on another device? Log in with email
          </button>
        )}
      </AuthShell>
    )
  }

  // ── Cloud restore (new / reset device) ─────────────────────
  if (mode === 'cloudRestore') {
    return (
      <AuthShell title="Log in with email">
        <p className="auth-note">Use this on a new or reset device to restore your boat from the cloud.
        Needs an internet connection.</p>
        <input className="auth-input" placeholder="Email" value={username}
          onChange={e => setUsername(e.target.value)} autoCapitalize="none" inputMode="email" />
        <input className="auth-input" type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-btn" disabled={busy || !username || !password}
          onClick={() => run(() => cloudRestore(username, password))}>
          {busy ? 'Restoring…' : 'Restore my boat'}
        </button>
        <button className="auth-link" onClick={() => { setError(''); setMode(firstRun ? 'signup' : 'login') }}>← Back</button>
      </AuthShell>
    )
  }

  // ── Log in ──────────────────────────────────────────────────
  return (
    <AuthShell title="Log in">
      {canBioUnlock && (
        <>
          <button className="auth-btn" disabled={busy} onClick={() => run(() => unlockBiometric())}>
            {busy ? 'Unlocking…' : 'Unlock with Face ID'}
          </button>
          <p className="auth-hint auth-or">or log in with your password</p>
        </>
      )}
      <input className="auth-input" placeholder="Username" value={username}
        onChange={e => setUsername(e.target.value)} autoCapitalize="none"
        onKeyDown={e => e.key === 'Enter' && document.getElementById('auth-pw')?.focus()} />
      <input id="auth-pw" className="auth-input" type="password" placeholder="Password" value={password}
        onChange={e => setPassword(e.target.value)} autoComplete="current-password"
        onKeyDown={e => { if (e.key === 'Enter' && username && password) run(() => login(username, password)) }} />
      {error && <p className="auth-error">{error}</p>}
      <button className="auth-btn" disabled={busy || !username || !password}
        onClick={() => run(() => login(username, password))}>
        {busy ? 'Logging in…' : 'Log in'}
      </button>
      <button className="auth-link" onClick={() => { setError(''); setCode(''); setMode('recover') }}>
        Forgot password?
      </button>
      {cloudReady && (
        <button className="auth-link" onClick={() => { setError(''); setMode('cloudRestore') }}>
          New or reset device? Log in with email
        </button>
      )}
    </AuthShell>
  )
}

function AuthShell({ title, children }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="auth-brand">Catalina 445</p>
        <h1 className="auth-title">{title}</h1>
        {children}
      </div>
    </div>
  )
}
