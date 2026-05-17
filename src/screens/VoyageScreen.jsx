import { useState, useCallback } from 'react'
import VoiceButton from '../components/VoiceButton'
import { exportVoyagePDF } from '../utils/exportVoyagePDF'

function formatDuration(start, end) {
  const ms = (end ? new Date(end) : new Date()) - new Date(start)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatTimeOnly(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateOnly(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateFull(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatStartDateTime(iso) {
  const d = new Date(iso)
  const date = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

function dayKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const EMPTY_ENTRY = { lat: '', lon: '', cog: '', sog: '', awa: '', aws: '', text: '' }

function LogEntryForm({ voyageId, onAdd }) {
  const [entry, setEntry] = useState(EMPTY_ENTRY)
  const [gpsLoading, setGpsLoading] = useState(false)
  const set = (k, v) => setEntry(prev => ({ ...prev, [k]: v }))
  const hasData = Object.values(entry).some(v => v.trim() !== '')

  const getGPS = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        // Format as degrees decimal minutes (nautical standard)
        const latDeg = Math.floor(Math.abs(latitude))
        const latMin = ((Math.abs(latitude) - latDeg) * 60).toFixed(3)
        const latDir = latitude >= 0 ? 'N' : 'S'
        const lonDeg = Math.floor(Math.abs(longitude))
        const lonMin = ((Math.abs(longitude) - lonDeg) * 60).toFixed(3)
        const lonDir = longitude >= 0 ? 'E' : 'W'
        set('lat', `${latDeg}°${latMin}'${latDir}`)
        set('lon', `${lonDeg}°${lonMin}'${lonDir}`)
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = () => {
    if (!hasData) return
    onAdd(voyageId, entry)
    setEntry(EMPTY_ENTRY)
  }

  return (
    <div className="log-form">
      <p className="log-form-title">New Log Entry</p>
      <div className="log-gps-row">
        <label className="log-field log-field--grow">
          <span>Lat</span>
          <input placeholder="33°45.200'N" value={entry.lat} onChange={e => set('lat', e.target.value)} />
        </label>
        <label className="log-field log-field--grow">
          <span>Lon</span>
          <input placeholder="118°12.400'W" value={entry.lon} onChange={e => set('lon', e.target.value)} />
        </label>
        <button className="gps-btn" onClick={getGPS} disabled={gpsLoading} title="Get current GPS position">
          {gpsLoading ? '…' : '📍'}
        </button>
      </div>
      <div className="log-form-grid">
        <label className="log-field">
          <span>COG °</span>
          <input type="number" min="0" max="359" value={entry.cog} onChange={e => set('cog', e.target.value)} />
        </label>
        <label className="log-field">
          <span>SOG kts</span>
          <input type="number" min="0" step="0.1" value={entry.sog} onChange={e => set('sog', e.target.value)} />
        </label>
        <label className="log-field">
          <span>AWA °</span>
          <input type="number" min="-180" max="180" value={entry.awa} onChange={e => set('awa', e.target.value)} />
        </label>
        <label className="log-field">
          <span>AWS kts</span>
          <input type="number" min="0" step="0.1" value={entry.aws} onChange={e => set('aws', e.target.value)} />
        </label>
      </div>
      <button className="add-entry-btn" onClick={handleSubmit} disabled={!hasData}>
        + Add Entry
      </button>
      <label className="log-field" style={{ marginTop: 10 }}>
        <span>Notes</span>
        <textarea
          className="log-textarea"
          placeholder="Conditions, observations, events…"
          value={entry.text}
          onChange={e => set('text', e.target.value)}
          onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)}
        />
      </label>
    </div>
  )
}

function LogEntryRow({ entry, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.text || '')

  const navParts = [
    entry.lat && entry.lon && `${entry.lat} ${entry.lon}`,
    entry.cog && `COG ${entry.cog}°`,
    entry.sog && `SOG ${entry.sog}kts`,
    entry.awa && `AWA ${entry.awa}°`,
    entry.aws && `AWS ${entry.aws}kts`,
  ].filter(Boolean)

  const save = () => { onEdit?.({ text: draft }); setEditing(false) }

  return (
    <div className="log-entry">
      <div className="log-entry-header">
        <span className="note-time">{formatTimeOnly(entry.time)}</span>
        {onEdit && !editing && (
          <button className="name-edit-btn" onClick={() => { setDraft(entry.text || ''); setEditing(true) }}>Edit</button>
        )}
      </div>
      {navParts.length > 0 && <p className="log-entry-nav">{navParts.join(' · ')}</p>}
      {editing ? (
        <div className="log-entry-edit">
          <textarea
            className="log-textarea log-textarea--compact"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
          <div className="log-entry-edit-actions">
            <button className="name-save-btn" onClick={save}>Save</button>
            <button className="pdf-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        entry.text && <p className="log-entry-text">{entry.text}</p>
      )}
    </div>
  )
}

function LogList({ notes, voyageId, onEdit }) {
  const reversed = [...notes].map((n, i) => ({ ...n, _origIndex: i })).reverse()
  let lastDay = null
  return (
    <div className="voyage-notes">
      {reversed.map((n, i) => {
        const day = dayKey(n.time)
        const showDate = day !== lastDay
        lastDay = day
        return (
          <div key={i}>
            {showDate && <div className="log-date-separator">{formatDateOnly(n.time)}</div>}
            <LogEntryRow
              entry={n}
              onEdit={onEdit ? (updates) => onEdit(voyageId, n._origIndex, updates) : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function VoyageScreen({ voyages, activeVoyage, startVoyage, endVoyage, resumeVoyage, renameVoyage, addVoyageNote, addLogEntry, updateLogEntry }) {
  const [name, setName] = useState('')
  const [feedback, setFeedback] = useState('')
  const [openId, setOpenId] = useState(null)
  const [editingVoyageId, setEditingVoyageId] = useState(null)
  const [editNameVal, setEditNameVal] = useState('')

  const startEdit = (voyage) => { setEditingVoyageId(voyage.id); setEditNameVal(voyage.name || voyage.destination || '') }
  const saveEdit = (id) => { renameVoyage(id, editNameVal.trim()); setEditingVoyageId(null) }
  const cancelEdit = () => setEditingVoyageId(null)

  const flash = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000) }

  const handleStart = () => {
    startVoyage(name.trim())
    setName('')
    flash('Voyage started!')
  }

  const handleVoiceCommand = useCallback((cmd, raw) => {
    if (!cmd) { flash(`Didn't understand: "${raw}"`); return }
    switch (cmd.action) {
      case 'startVoyage':
        startVoyage(cmd.destination || '')
        flash('✓ Voyage started')
        break
      case 'endVoyage':
        if (activeVoyage) { endVoyage(activeVoyage.id); flash('✓ Voyage ended') }
        else flash('No active voyage')
        break
      case 'note':
        if (activeVoyage) { addVoyageNote(activeVoyage.id, cmd.text); flash('✓ Note logged') }
        else flash('Start a voyage first')
        break
      default:
        flash(`Command not available here: "${raw}"`)
    }
  }, [activeVoyage, startVoyage, endVoyage, addVoyageNote])

  const pastVoyages = voyages.filter(v => v.status === 'completed')

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">Voyage Log</h1>
          <p className="screen-subtitle">{voyages.length} voyage{voyages.length !== 1 ? 's' : ''} logged</p>
        </div>
        <VoiceButton
          onCommand={handleVoiceCommand}
          context={activeVoyage ? '"Log squall approaching" · "End voyage"' : '"Start voyage to Newport"'}
        />
      </header>

      {feedback && <div className="global-feedback">{feedback}</div>}

      <div className="screen-body voyage-body">

        {/* Active voyage */}
        {activeVoyage ? (
          <div className="voyage-active">
            <div className="voyage-active-header">
              <div>
                <p className="voyage-active-label">UNDERWAY</p>
                {editingVoyageId === activeVoyage.id ? (
                  <div className="voyage-name-edit">
                    <input
                      className="voyage-name-input"
                      value={editNameVal}
                      onChange={e => setEditNameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(activeVoyage.id); if (e.key === 'Escape') cancelEdit() }}
                      autoFocus
                    />
                    <button className="name-save-btn" onClick={() => saveEdit(activeVoyage.id)}>Save</button>
                  </div>
                ) : (
                  <div className="voyage-name-row">
                    <h2 className="voyage-active-dest">{activeVoyage.name || activeVoyage.destination || 'Unnamed Voyage'}</h2>
                    <button className="name-edit-btn" onClick={() => startEdit(activeVoyage)}>Edit</button>
                  </div>
                )}
                <div className="voyage-active-datetime">
                  <span>{formatStartDateTime(activeVoyage.startTime).date}</span>
                  <span>{formatStartDateTime(activeVoyage.startTime).time}</span>
                </div>
                <p className="voyage-active-time">{formatDuration(activeVoyage.startTime)} elapsed</p>
              </div>
              <div className="voyage-active-actions">
                <button className="end-btn" onClick={() => endVoyage(activeVoyage.id)}>End Voyage</button>
                <button className="pdf-btn" onClick={() => exportVoyagePDF(activeVoyage)}>Export PDF</button>
              </div>
            </div>

            <LogEntryForm voyageId={activeVoyage.id} onAdd={addLogEntry} />

            <LogList notes={activeVoyage.notes} voyageId={activeVoyage.id} onEdit={updateLogEntry} />
          </div>
        ) : (
          <div className="voyage-start">
            <p className="voyage-start-label">No active voyage</p>
            <div className="note-form">
              <input
                className="add-input add-input--name"
                placeholder="Voyage name"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
              <button className="start-btn" onClick={handleStart}>Start Voyage</button>
            </div>
          </div>
        )}

        {/* Past voyages */}
        {pastVoyages.length > 0 && (
          <div className="past-voyages">
            <h3 className="past-title">Past Voyages</h3>
            {pastVoyages.map(v => (
              <div key={v.id} className={`past-voyage ${openId === v.id ? 'past-voyage--open' : ''}`}>
                <button
                  className="past-voyage-header"
                  onClick={() => setOpenId(openId === v.id ? null : v.id)}
                >
                  <div className="past-voyage-info">
                    <span className="past-dest">{v.name || v.destination || 'Unnamed Voyage'}</span>
                    <span className="past-date">{formatDateFull(v.startTime)}</span>
                    <span className="past-dur">{formatDuration(v.startTime, v.endTime)}</span>
                  </div>
                  <span className="past-toggle">{openId === v.id ? '▲' : '▼'}</span>
                </button>

                {openId === v.id && (
                  <div className="past-voyage-log">
                    <div className="past-voyage-toolbar">
                      <button className="restart-btn" onClick={() => { resumeVoyage(v.id); flash(`Resumed "${v.name || v.destination || 'voyage'}"`) }}>
                        Continue
                      </button>
                      <button className="name-edit-btn" onClick={() => startEdit(v)}>Edit Name</button>
                      <button className="pdf-btn" onClick={() => exportVoyagePDF(v)}>Export PDF</button>
                    </div>
                    {editingVoyageId === v.id && (
                      <div className="voyage-name-edit" style={{ marginBottom: 12 }}>
                        <input
                          className="voyage-name-input"
                          value={editNameVal}
                          onChange={e => setEditNameVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(v.id); if (e.key === 'Escape') cancelEdit() }}
                          autoFocus
                        />
                        <button className="name-save-btn" onClick={() => saveEdit(v.id)}>Save</button>
                      </div>
                    )}
                    {v.notes.length === 0
                      ? <p className="item-empty">No log entries</p>
                      : <LogList notes={v.notes} voyageId={v.id} onEdit={updateLogEntry} />
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
