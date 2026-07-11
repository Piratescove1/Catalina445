import { useState } from 'react'
import { useCompartments } from '../context/CompartmentsContext'
import { COMPARTMENT_ICONS } from '../data/compartments'
import { fileToCompressedDataURL } from '../lib/image'

export default function ManageCompartments({ inventory, onClose }) {
  const {
    compartments, areas,
    addCompartment, updateCompartment, deleteCompartment, moveCompartment, resetCompartments,
    addArea, renameArea, setAreaImage, deleteArea,
  } = useCompartments()
  const [newName, setNewName] = useState('')
  const [newAreaName, setNewAreaName] = useState('')
  const [addAreaId, setAddAreaId] = useState(areas[0]?.id || '')
  const [confirmReset, setConfirmReset] = useState(false)
  const [busyArea, setBusyArea] = useState(null)

  const count = (id) => (inventory?.[id] || []).reduce((s, i) => s + i.qty, 0)

  const removeComp = (c) => {
    const n = count(c.id)
    const msg = n > 0
      ? `"${c.name}" has ${n} item(s). Remove it anyway? The items stay saved but will be hidden.`
      : `Remove "${c.name}"?`
    if (window.confirm(msg)) deleteCompartment(c.id)
  }

  const uploadImage = async (areaId, file) => {
    if (!file) return
    setBusyArea(areaId)
    try {
      const dataUrl = await fileToCompressedDataURL(file)
      setAreaImage(areaId, dataUrl)
    } catch {
      alert('Could not read that image. Try a JPG or PNG.')
    } finally {
      setBusyArea(null)
    }
  }

  return (
    <div className="help-overlay">
      <div className="auth-card manage-card">
        <div className="help-header">
          <p className="help-title">Manage compartments</p>
          <button className="log-form-cancel" onClick={onClose}>✕</button>
        </div>

        {/* Areas / tabs */}
        <p className="manage-section-title">Areas (tabs)</p>
        <p className="auth-note">Each area is a tab with its own drawing. Upload a picture of that part of the boat,
        then use “Place markers” on the tab to drop each compartment where it lives.</p>
        <div className="manage-list">
          {areas.map(a => (
            <div key={a.id} className="manage-row">
              <input className="manage-name" value={a.name}
                onChange={e => renameArea(a.id, e.target.value)} />
              <label className="manage-upload">
                {busyArea === a.id ? '…' : (a.image ? 'Replace' : 'Upload drawing')}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { uploadImage(a.id, e.target.files?.[0]); e.target.value = '' }} />
              </label>
              {a.image && <button className="manage-mini" title="Remove drawing" onClick={() => setAreaImage(a.id, null)}>🗑</button>}
              {areas.length > 1 && (
                <button className="manage-mini manage-del" title="Delete area"
                  onClick={() => { if (window.confirm(`Delete area "${a.name}"? Its compartments move to "${areas.find(x => x.id !== a.id)?.name}".`)) deleteArea(a.id) }}>✕</button>
              )}
            </div>
          ))}
        </div>
        <div className="manage-add">
          <input className="auth-input" placeholder="New area name (e.g. Cockpit lockers)" value={newAreaName}
            onChange={e => setNewAreaName(e.target.value)} />
          <button className="auth-btn manage-add-btn" disabled={!newAreaName.trim()}
            onClick={() => { addArea(newAreaName); setNewAreaName('') }}>Add area</button>
        </div>

        {/* Compartments */}
        <p className="manage-section-title" style={{ marginTop: 14 }}>Compartments</p>
        <div className="manage-list">
          {compartments.map((c, i) => (
            <div key={c.id} className="manage-row">
              <span className="manage-num">{c.num}</span>
              <select className="manage-icon" value={c.icon}
                onChange={e => updateCompartment(c.id, { icon: e.target.value })}>
                {COMPARTMENT_ICONS.includes(c.icon) ? null : <option value={c.icon}>{c.icon}</option>}
                {COMPARTMENT_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <input className="manage-name" value={c.name}
                onChange={e => updateCompartment(c.id, { name: e.target.value })} />
              <select className="manage-area" value={c.areaId}
                onChange={e => updateCompartment(c.id, { areaId: e.target.value })}>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div className="manage-actions">
                <button className="manage-mini" disabled={i === 0} onClick={() => moveCompartment(c.id, -1)}>▲</button>
                <button className="manage-mini" disabled={i === compartments.length - 1} onClick={() => moveCompartment(c.id, 1)}>▼</button>
                <button className="manage-mini manage-del" onClick={() => removeComp(c)}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div className="manage-add">
          <input className="auth-input" placeholder="New compartment name" value={newName}
            onChange={e => setNewName(e.target.value)} />
          <select className="manage-area" value={addAreaId} onChange={e => setAddAreaId(e.target.value)}>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button className="auth-btn manage-add-btn" disabled={!newName.trim()}
            onClick={() => { addCompartment(newName, '📦', addAreaId || areas[0]?.id); setNewName('') }}>Add</button>
        </div>

        {confirmReset ? (
          <div className="manage-confirm">
            <p className="auth-hint">Replace areas + compartments with the Catalina 445 defaults? Your items stay
            saved but may be hidden if a compartment is removed.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="dialog-btn dialog-btn--danger" onClick={() => { resetCompartments(); setConfirmReset(false) }}>Reset</button>
              <button className="dialog-btn" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="auth-link" onClick={() => setConfirmReset(true)}>Reset to Catalina 445 defaults</button>
        )}

        <button className="sync-close" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
