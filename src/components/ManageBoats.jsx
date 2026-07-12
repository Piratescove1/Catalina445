import { useState } from 'react'
import { useBoats } from '../context/BoatsContext'

export default function ManageBoats({ onClose }) {
  const { boats, activeBoatId, switchBoat, addBoat, renameBoat, deleteBoat } = useBoats()
  const [newName, setNewName] = useState('')

  return (
    <div className="help-overlay">
      <div className="auth-card manage-card">
        <div className="help-header">
          <p className="help-title">Your boats</p>
          <button className="log-form-cancel" onClick={onClose}>✕</button>
        </div>
        <p className="auth-note">Switch between boats or add another. Each boat keeps its own drawings, inventory,
        lockers, maintenance, ditch bag and voyages. Your <strong>provisioning list is shared</strong> across all of
        them.</p>

        <div className="manage-list">
          {boats.map(b => (
            <div key={b.id} className={`manage-row ${b.id === activeBoatId ? 'manage-row--active' : ''}`}>
              <input className="manage-name" value={b.name} onChange={e => renameBoat(b.id, e.target.value)} />
              {b.id === activeBoatId
                ? <span className="boat-active-tag">Active</span>
                : <button className="export-btn" onClick={() => switchBoat(b.id)}>Switch</button>}
              {boats.length > 1 && b.id !== activeBoatId && (
                <button className="manage-mini manage-del"
                  onClick={() => { if (window.confirm(`Remove "${b.name}" and its data from this device?`)) deleteBoat(b.id) }}>✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="manage-add">
          <input className="auth-input" placeholder="New boat name" value={newName}
            onChange={e => setNewName(e.target.value)} />
          <button className="auth-btn manage-add-btn" disabled={!newName.trim()}
            onClick={() => addBoat(newName)}>Add boat</button>
        </div>

        <button className="sync-close" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
