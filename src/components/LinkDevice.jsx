import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const ERR = {
  'bad-bundle': 'That link text doesn’t look right. Copy it again from the other device.',
  'bad-code': 'That transfer code is not correct.',
  'bad-password': 'Incorrect password for this device.',
}

export default function LinkDevice({ mode, onClose }) {
  return (
    <div className="help-overlay">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="help-header">
          <p className="help-title">{mode === 'share' ? 'Link another device' : 'Link this device'}</p>
          <button className="log-form-cancel" onClick={onClose}>✕</button>
        </div>
        {mode === 'share' ? <ShareSide /> : <ReceiveSide />}
        <button className="sync-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

function ShareSide() {
  const { createDeviceLink } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    createDeviceLink().then(setData).catch(() => setError('Could not create a link. Make sure you’re logged in.'))
  }, [createDeviceLink])

  if (error) return <p className="auth-error">{error}</p>
  if (!data) return <p className="auth-note">Preparing…</p>

  const share = async () => {
    try { await navigator.share({ title: 'Catalina 445 link', text: data.bundle }) } catch { /* cancelled */ }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(data.bundle); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  return (
    <>
      <p className="auth-note">On the <strong>other</strong> device: Settings → <strong>Link this device</strong>,
      paste the link below, and enter this transfer code.</p>

      <p className="help-section-title" style={{ marginBottom: 2 }}>Transfer code</p>
      <div className="auth-reccode">{data.code}</div>

      <p className="help-section-title" style={{ marginTop: 8, marginBottom: 2 }}>Link text</p>
      <textarea className="log-textarea link-bundle" readOnly value={data.bundle} onFocus={e => e.target.select()} />
      <div className="row" style={{ display: 'flex', gap: 8 }}>
        {navigator.share && <button className="auth-btn" style={{ flex: 1 }} onClick={share}>Share (AirDrop…)</button>}
        <button className="export-btn" style={{ flex: 1 }} onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button>
      </div>
      <p className="auth-hint">The link is encrypted — it’s useless without the transfer code. Read the code out
      loud or send it separately.</p>
    </>
  )
}

function ReceiveSide() {
  const { linkThisDevice } = useAuth()
  const [bundle, setBundle] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState(null)

  const submit = async () => {
    setError(''); setBusy(true)
    try {
      const rc = await linkThisDevice({ bundle, code, password })
      setRecoveryCode(rc)
    } catch (e) {
      setError(ERR[e.message] || 'Could not link this device. Please try again.')
    } finally { setBusy(false) }
  }

  if (recoveryCode) {
    return (
      <>
        <p className="auth-note">✅ This device now shares the boat key. Save your <strong>new</strong> recovery
        code (the old one no longer works), then reload.</p>
        <div className="auth-reccode">{recoveryCode}</div>
        <p className="auth-hint">You’ll log in again after reloading, and you can re-enable Face ID in Settings.</p>
        <button className="auth-btn" onClick={() => window.location.reload()}>I’ve saved it — reload</button>
      </>
    )
  }

  return (
    <>
      <p className="auth-note">Paste the link text from your other device, then enter its transfer code and
      <strong> this device’s</strong> password.</p>
      <textarea className="log-textarea link-bundle" placeholder="Paste link text here" value={bundle}
        onChange={e => setBundle(e.target.value)} />
      <input className="auth-input" placeholder="Transfer code" value={code}
        onChange={e => setCode(e.target.value)} autoCapitalize="characters" />
      <input className="auth-input" type="password" placeholder="This device’s password" value={password}
        onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
      {error && <p className="auth-error">{error}</p>}
      <button className="auth-btn" disabled={busy || !bundle.trim() || !code.trim() || !password}
        onClick={submit}>{busy ? 'Linking…' : 'Link this device'}</button>
    </>
  )
}
