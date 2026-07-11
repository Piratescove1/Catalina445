import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const ERR = {
  'auth-not-enabled': 'Cloud login isn’t switched on for this app yet (see setup).',
  'email-in-use': 'That email already has an account.',
  'bad-email': 'That doesn’t look like a valid email.',
  'weak-password': 'Password must be at least 6 characters.',
  'bad-password': 'That’s not this device’s password.',
  'offline': 'You need an internet connection to enable cloud login.',
}

export default function CloudLogin({ onClose }) {
  const { cloudEmail, enableCloud } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    setError(''); setBusy(true)
    try { await enableCloud(email, password); setDone(true) }
    catch (e) { setError(ERR[e.message] || 'Could not enable cloud login. Please try again.') }
    finally { setBusy(false) }
  }

  return (
    <div className="help-overlay">
      <div className="auth-card" style={{ maxWidth: 420 }}>
        <div className="help-header">
          <p className="help-title">Cloud login &amp; backup</p>
          <button className="log-form-cancel" onClick={onClose}>✕</button>
        </div>

        {cloudEmail ? (
          <>
            <p className="auth-note">Cloud login is <strong>on</strong> for this boat: <strong>{cloudEmail}</strong>.
            On a new or reset device, choose “Log in with email” to restore everything.</p>
            <button className="sync-close" onClick={onClose}>Done</button>
          </>
        ) : done ? (
          <>
            <p className="auth-note">✅ Cloud login enabled. If this device is ever wiped or replaced, open the app on
            the new device, choose <strong>“Log in with email,”</strong> and enter this email + your password to
            restore your boat.</p>
            <button className="auth-btn" onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <p className="auth-note">Add an email so you can log back in and restore your boat if this device is ever
            cleared or replaced. Use <strong>your current password.</strong> (Needs internet.)</p>
            <input className="auth-input" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} autoCapitalize="none" inputMode="email" />
            <input className="auth-input" type="password" placeholder="Your password" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn" disabled={busy || !email.trim() || !password} onClick={submit}>
              {busy ? 'Enabling…' : 'Enable cloud login'}
            </button>
            <button className="sync-close" onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}
