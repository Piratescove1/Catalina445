import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { useAuth } from '../context/AuthContext'

const ERR = {
  'bad-bundle': 'That link doesn’t look right — scan the QR code again.',
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

// ── Source device: show the QR + transfer code ──────────────
function ShareSide() {
  const { createDeviceLink } = useAuth()
  const [data, setData] = useState(null)
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    createDeviceLink().then(setData).catch(() => setError('Could not create a link. Make sure you’re logged in.'))
  }, [createDeviceLink])

  useEffect(() => {
    if (data) QRCode.toDataURL(data.bundle, { width: 260, margin: 1, errorCorrectionLevel: 'M' }).then(setQr).catch(() => {})
  }, [data])

  if (error) return <p className="auth-error">{error}</p>
  if (!data) return <p className="auth-note">Preparing…</p>

  return (
    <>
      <p className="auth-note">On the <strong>other</strong> device: Settings → <strong>Link this device</strong> →
      <strong> Scan QR code</strong>, point it at this screen, then enter the transfer code below.</p>
      {qr && <img className="qr-img" src={qr} alt="Link QR code" />}
      <p className="help-section-title" style={{ marginBottom: 2, textAlign: 'center' }}>Transfer code</p>
      <div className="auth-reccode">{data.code}</div>
      <p className="auth-hint">The QR is encrypted — it’s useless without the transfer code, so it’s safe to show.</p>
    </>
  )
}

// ── Target device: scan the QR, enter code + password ───────
function ReceiveSide() {
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
    try {
      setRecoveryCode(await linkThisDevice({ bundle, code, password }))
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
        <p className="auth-hint">You’ll log in again after reloading; re-enable Face ID in Settings if you want it.</p>
        <button className="auth-btn" onClick={() => window.location.reload()}>I’ve saved it — reload</button>
      </>
    )
  }

  if (scanning) {
    return <QrScanner onResult={(t) => { setBundle(t); setScanning(false) }} onCancel={() => setScanning(false)} />
  }

  return (
    <>
      <p className="auth-note">Scan the QR shown on your other device, then enter its transfer code and
      <strong> this device’s</strong> password.</p>

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
        if (found && found.data) {
          done = true
          stop(stream, raf)
          onResult(found.data)
          return
        }
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
      .catch(() => setError('Camera not available. Use “Paste link instead”.'))

    return () => { done = true; stop(stream, raf) }
  }, [onResult, stop])

  return (
    <div className="qr-scan">
      {error
        ? <p className="auth-error">{error}</p>
        : <video ref={videoRef} className="qr-video" muted playsInline />}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <p className="auth-hint">Point the camera at the QR code on your other device.</p>
      <button className="sync-close" onClick={onCancel}>Cancel</button>
    </div>
  )
}
