import { useState } from 'react'
import { useCompartments } from '../context/CompartmentsContext'
import { COMPARTMENT_ICONS } from '../data/compartments'

export default function ManageCompartments({ inventory, onClose }) {
  const {
    compartments, addCompartment, updateCompartment, deleteCompartment, moveCompartment, resetCompartments,
  } = useCompartments()
  const [newName, setNewName] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const count = (id) => (inventory?.[id] || []).reduce((s, i) => s + i.qty, 0)

  const remove = (c) => {
    const n = count(c.id)
    const msg = n > 0
      ? `"${c.name}" has ${n} item(s). Remove it anyway? The items stay saved but will be hidden.`
      : `Remove "${c.name}"?`
    if (window.confirm(msg)) deleteCompartment(c.id)
  }

  return (
    <div className="help-overlay">
      <div className="auth-card manage-card">
        <div className="help-header">
          <p className="help-title">Manage compartments</p>
          <button className="log-form-cancel" onClick={onClose}>✕</button>
        </div>
        <p className="auth-note">Rename, reorder, add or remove your boat’s storage locations. Changes save
        automatically.</p>

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
              <div className="manage-actions">
                <button className="manage-mini" disabled={i === 0} onClick={() => moveCompartment(c.id, -1)}>▲</button>
                <button className="manage-mini" disabled={i === compartments.length - 1} onClick={() => moveCompartment(c.id, 1)}>▼</button>
                <button className="manage-mini manage-del" onClick={() => remove(c)}>✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className="manage-add">
          <input className="auth-input" placeholder="New compartment name" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) { addCompartment(newName); setNewName('') } }} />
          <button className="auth-btn manage-add-btn" disabled={!newName.trim()}
            onClick={() => { addCompartment(newName); setNewName('') }}>Add</button>
        </div>

        {confirmReset ? (
          <div className="manage-confirm">
            <p className="auth-hint">Replace your list with the default 25 Catalina 445 compartments? Your items
            stay saved but may be hidden if a compartment they’re in is removed.</p>
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
