import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { useAuth } from '../context/AuthContext'

const ERR = {
  'bad-bundle': 'That link doesn’t look right — scan the QR code again.',
  'bad-code': 'That transfer code is not correct.',
  'bad-password': 'Incorrect password for this device.',
  'pairing-not-found': 'No matching code found. Check it, or the code may have expired (15 min).',
  'pairing-expired': 'That code has expired. Generate a new one on the other device.',
  'offline': 'The typing code needs internet on both devices. Use the QR method when offline.',
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

function Tabs({ value, onChange, options }) {
  return (
    <div className="link-tabs">
      {options.map(o => (
        <button key={o.value}
          className={`link-tab ${value === o.value ? 'link-tab--active' : ''}`}
          onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

// ── Source device ───────────────────────────────────────────
function ShareSide() {
  const { createDeviceLink, startPairingLink } = useAuth()
  const [method, setMethod] = useState('qr')
  return (
    <>
      <Tabs value={method} onChange={setMethod} options={[
        { value: 'qr', label: 'Show QR' },
        { value: 'code', label: 'Typing code' },
      ]} />
      {method === 'qr'
        ? <ShareQR createDeviceLink={createDeviceLink} />
        : <ShareCode startPairingLink={startPairingLink} />}
    </>
  )
}

function ShareQR({ createDeviceLink }) {
  const [data, setData] = useState(null)
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    createDeviceLink().then(setData).catch(() => setError('Could not create a link. Make sure you’re logged in.'))
  }, [createDeviceLink])
  useEffect(() => {
    if (data) QRCode.toDataURL(data.bundle, { width: 260, margin: 1 }).then(setQr).catch(() => {})
  }, [data])

  if (error) return <p className="auth-error">{error}</p>
  if (!data) return <p className="auth-note">Preparing…</p>
  return (
    <>
      <p className="auth-note">On the other device: <strong>Link this device → Scan QR</strong>, point at this
      screen, then enter the transfer code.</p>
      {qr && <img className="qr-img" src={qr} alt="Link QR code" />}
      <p className="help-section-title" style={{ textAlign: 'center', marginBottom: 2 }}>Transfer code</p>
      <div className="auth-reccode">{data.code}</div>
      <p className="auth-hint">Works fully offline. The QR is encrypted — useless without the transfer code.</p>
    </>
  )
}

function ShareCode({ startPairingLink }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    setError(''); setBusy(true)
    try { setCode(await startPairingLink()) }
    catch (e) { setError(ERR[e.message] || 'Could not create a code.') }
    finally { setBusy(false) }
  }

  return (
    <>
      <p className="auth-note">For a device with no camera. Needs internet on both devices; the code works once
      and expires in 15 minutes.</p>
      {code
        ? (<>
            <p className="help-section-title" style={{ textAlign: 'center', marginBottom: 2 }}>Type this on the other device</p>
            <div className="auth-reccode">{code}</div>
            <p className="auth-hint">On the other device: <strong>Link this device → Typing code</strong>, enter this,
            plus that device’s password.</p>
          </>)
        : (<>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn" disabled={busy} onClick={generate}>
              {busy ? 'Creating…' : 'Create a typing code'}
            </button>
          </>)}
    </>
  )
}

// ── Target device ───────────────────────────────────────────
function ReceiveSide() {
  const [method, setMethod] = useState('scan')
  return (
    <>
      <Tabs value={method} onChange={setMethod} options={[
        { value: 'scan', label: 'Scan QR' },
        { value: 'code', label: 'Typing code' },
      ]} />
      {method === 'scan' ? <ReceiveScan /> : <ReceiveCode />}
    </>
  )
}

function RecoveryDone({ recoveryCode }) {
  return (
    <>
      <p className="auth-note">✅ This device now shares the boat key. Save your <strong>new</strong> recovery
      code (the old one no longer works), then reload.</p>
      <div className="auth-reccode">{recoveryCode}</div>
      <p className="auth-hint">You’ll log in again after reloading; re-enable Face ID in Settings if you want it.</p>
      <button className="auth-btn" onClick={() => window.location.reload()}>I’ve saved it — reload</button>
    </>
  )
}

function ReceiveScan() {
  const { linkThisDevice } = useAuth()
  const [bundle, setBundle] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [scanning, setScanning] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState(null)

  const submit = async () => {
    setError(''); setBusy(true)
    try { setRecoveryCode(await linkThisDevice({ bundle, code, password })) }
    catch (e) { setError(ERR[e.message] || 'Could not link this device.') }
    finally { setBusy(false) }
  }

  if (recoveryCode) return <RecoveryDone recoveryCode={recoveryCode} />
  if (scanning) return <QrScanner onResult={(t) => { setBundle(t); setScanning(false) }} onCancel={() => setScanning(false)} />

  return (
    <>
      <p className="auth-note">Scan the QR on your other device, then enter its transfer code and this device’s
      password.</p>
      {bundle
        ? <p className="link-ok">✓ QR captured</p>
        : <button className="auth-btn" onClick={() => { setError(''); setScanning(true) }}>Scan QR code</button>}
      <button className="auth-link" onClick={() => setShowPaste(v => !v)}>
        {showPaste ? 'Hide paste option' : 'Can’t scan? Paste link instead'}
      </button>
      {showPaste && (
        <textarea className="log-textarea link-bundle" placeholder="Paste link text" value={bundle}
          onChange={e => setBundle(e.target.value)} />
      )}
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

function ReceiveCode() {
  const { linkWithCode } = useAuth()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState(null)

  const submit = async () => {
    setError(''); setBusy(true)
    try { setRecoveryCode(await linkWithCode({ code, password })) }
    catch (e) { setError(ERR[e.message] || 'Could not link this device.') }
    finally { setBusy(false) }
  }

  if (recoveryCode) return <RecoveryDone recoveryCode={recoveryCode} />
  return (
    <>
      <p className="auth-note">Enter the typing code shown on your other device, plus this device’s password.
      (Both devices need internet.)</p>
      <input className="auth-input" placeholder="Typing code" value={code}
        onChange={e => setCode(e.target.value)} autoCapitalize="characters" />
      <input className="auth-input" type="password" placeholder="This device’s password" value={password}
        onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
      {error && <p className="auth-error">{error}</p>}
      <button className="auth-btn" disabled={busy || !code.trim() || !password}
        onClick={submit}>{busy ? 'Linking…' : 'Link this device'}</button>
    </>
  )
}

// ── Camera QR scanner (jsQR) ────────────────────────────────
function QrScanner({ onResult, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [error, setError] = useState('')

  const stop = useCallback((stream, raf) => {
    if (raf) cancelAnimationFrame(raf)
    if (stream) stream.getTracks().forEach(t => t.stop())
  }, [])

  useEffect(() => {
    let stream = null
    let raf = null
    let done = false

    const tick = () => {
      const v = videoRef.current
      const c = canvasRef.current
      if (!done && v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
        c.width = v.videoWidth
        c.height = v.videoHeight
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(v, 0, 0, c.width, c.height)
        const img = ctx.getImageData(0, 0, c.width, c.height)
        const found = jsQR(img.data, img.width, img.height)
        if (found && found.data) { done = true; stop(stream, raf); onResult(found.data); return }
      }
      raf = requestAnimationFrame(tick)
    }

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s
        const v = videoRef.current
        if (!v) return
        v.srcObject = s
        v.setAttribute('playsinline', 'true')
        return v.play()
      })
      .then(() => { raf = requestAnimationFrame(tick) })
      .catch(() => setError('Camera not available. Use the paste option or a typing code.'))

    return () => { done = true; stop(stream, raf) }
  }, [onResult, stop])

  return (
    <div className="qr-scan">
      {error ? <p className="auth-error">{error}</p> : <video ref={videoRef} className="qr-video" muted playsInline />}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <p className="auth-hint">Point the camera at the QR code on your other device.</p>
      <button className="sync-close" onClick={onCancel}>Cancel</button>
    </div>
  )
}
