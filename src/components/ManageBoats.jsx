import { useState } from 'react'
import { useBoats } from '../context/BoatsContext'

export default function ManageBoats({ onClose }) {
  const { boats, activeBoatId, switchBoat, addBoat, renameBoat, deleteBoat } = useBoats()
  const [newName, setNewName] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const confirmBoat = boats.find(b => b.id === confirmId)

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
            <div key={b.id} className={`boat-card ${b.id === activeBoatId ? 'boat-card--active' : ''}`}>
              <input className="boat-name-input" value={b.name} placeholder="Boat name"
                onChange={e => renameBoat(b.id, e.target.value)} />
              <div className="boat-card-actions">
                {b.id === activeBoatId
                  ? <span className="boat-active-tag">Active boat</span>
                  : <button className="export-btn" onClick={() => switchBoat(b.id)}>Switch to this boat</button>}
                {boats.length > 1 && (
                  <button className="manage-mini manage-del boat-del" onClick={() => setConfirmId(b.id)}>🗑 Delete</button>
                )}
              </div>
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

      {confirmBoat && (
        <div className="dialog-overlay">
          <div className="dialog">
            <p className="dialog-title">Delete this boat?</p>
            <p className="dialog-body">
              Permanently delete <strong>“{confirmBoat.name || 'this boat'}”</strong> and all of its data — drawings,
              inventory, lockers, maintenance, ditch bag and voyages — from this device. This can’t be undone.
              {confirmBoat.id === activeBoatId && ' You’ll be switched to another boat.'}
            </p>
            <p className="dialog-body dialog-body--dim">Your shared provisioning list is not affected.</p>
            <div className="dialog-btns">
              <button className="dialog-btn dialog-btn--danger"
                onClick={() => { const id = confirmId; setConfirmId(null); deleteBoat(id) }}>
                Yes, delete boat
              </button>
              <button className="dialog-btn" onClick={() => setConfirmId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
