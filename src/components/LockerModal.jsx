import { useState } from 'react'
import { LOCKERS } from '../data/lockers'

export default function LockerModal({
  lockerId, lockerInventory, onClose,
  onAddItem, onSetQty, onDeleteItem, onRenameItem,
  label, onSetLabel,
}) {
  const locker = LOCKERS.find(l => l.id === lockerId)
  if (!locker) return null
  const items = lockerInventory[lockerId] || []
  const displayName = label || locker.name

  const [editMode,   setEditMode]   = useState(false)
  const [titleDraft, setTitleDraft] = useState(displayName)
  const [itemDrafts, setItemDrafts] = useState({})
  const [newName,    setNewName]    = useState('')
  const [newQty,     setNewQty]     = useState('1')
  const [newUnit,    setNewUnit]    = useState('')
  const [feedback,   setFeedback]   = useState('')

  const flash = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000) }

  const enterEdit = () => {
    setTitleDraft(displayName)
    const drafts = {}
    items.forEach(it => { drafts[it.name] = it.name })
    setItemDrafts(drafts)
    setEditMode(true)
  }

  const saveEdit = () => {
    if (titleDraft.trim() && titleDraft.trim() !== (label || locker.name)) {
      onSetLabel(lockerId, titleDraft.trim())
    }
    items.forEach(it => {
      const draft = itemDrafts[it.name]
      if (draft && draft.trim() && draft.trim() !== it.name) {
        onRenameItem(lockerId, it.name, draft.trim())
      }
    })
    setEditMode(false)
  }

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    const qty = parseFloat(newQty) || 1
    onAddItem(lockerId, name, qty, newUnit.trim())
    setNewName(''); setNewQty('1'); setNewUnit('')
    flash(`Added ${qty} × ${name}`)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        <div className="modal-header">
          <span className="modal-icon">{locker.icon}</span>
          <h2 className="modal-title">#{locker.num} — {displayName}</h2>
          <button
            className={`modal-edit-btn ${editMode ? 'modal-edit-btn--active' : ''}`}
            onClick={editMode ? saveEdit : enterEdit}
          >
            {editMode ? 'Save' : 'Edit'}
          </button>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {editMode && (
          <div className="modal-label-row">
            <label className="modal-label-hint">Locker name</label>
            <input
              className="add-input modal-title-input"
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              placeholder={locker.name}
            />
          </div>
        )}

        {feedback && <div className="modal-feedback">{feedback}</div>}

        <div className="item-list">
          {items.length === 0 ? (
            <p className="item-empty">No items yet. Add one below.</p>
          ) : (
            items.map(item => (
              <div key={item.name} className="item-row">
                {editMode ? (
                  <input
                    className="add-input item-rename-input"
                    value={itemDrafts[item.name] ?? item.name}
                    onChange={e => setItemDrafts(d => ({ ...d, [item.name]: e.target.value }))}
                  />
                ) : (
                  <>
                    <span className="item-name">{item.name}</span>
                    {item.unit && <span className="item-unit">{item.unit}</span>}
                  </>
                )}
                <div className="item-controls">
                  <button className="qty-btn" onClick={() => onSetQty(lockerId, item.name, item.qty - 1)}>−</button>
                  <span className="item-qty">{item.qty}</span>
                  <button className="qty-btn" onClick={() => onSetQty(lockerId, item.name, item.qty + 1)}>+</button>
                  <button className="del-btn" onClick={() => onDeleteItem(lockerId, item.name)} aria-label="Delete">🗑</button>
                </div>
              </div>
            ))
          )}
        </div>

        {!editMode && (
          <div className="add-form">
            <input
              className="add-input add-input--name"
              type="text" placeholder="Item name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <input
              className="add-input add-input--qty"
              type="number" min="0" placeholder="Qty"
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
            />
            <input
              className="add-input add-input--unit"
              type="text" placeholder="Unit"
              value={newUnit}
              onChange={e => setNewUnit(e.target.value)}
            />
            <button className="add-btn" onClick={handleAdd} disabled={!newName.trim()}>Add</button>
          </div>
        )}
      </div>
    </div>
  )
}
