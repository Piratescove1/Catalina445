import { useState, useCallback } from 'react'
import { COMPARTMENTS } from '../data/compartments'
import VoiceButton from './VoiceButton'

export default function CompartmentModal({
  compartmentId, inventory, onClose,
  onAddItem, onRemoveItem, onSetQty, onDeleteItem, onRenameItem, onFindItem,
  label, onSetLabel,
}) {
  const compartment = COMPARTMENTS.find(c => c.id === compartmentId)
  if (!compartment) return null
  const items = inventory[compartmentId] || []
  const displayName = label || compartment.name

  const [editMode,     setEditMode]     = useState(false)
  const [titleDraft,   setTitleDraft]   = useState(displayName)
  const [itemDrafts,   setItemDrafts]   = useState({})
  const [newName,      setNewName]      = useState('')
  const [newQty,       setNewQty]       = useState('1')
  const [newUnit,      setNewUnit]      = useState('')
  const [feedback,     setFeedback]     = useState('')

  const flash = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000) }

  const enterEdit = () => {
    setTitleDraft(displayName)
    const drafts = {}
    items.forEach(it => { drafts[it.name] = it.name })
    setItemDrafts(drafts)
    setEditMode(true)
  }

  const saveEdit = () => {
    // Save compartment label if changed
    if (titleDraft.trim() && titleDraft.trim() !== (label || compartment.name)) {
      onSetLabel(compartmentId, titleDraft.trim())
    }
    // Save any renamed items
    items.forEach(it => {
      const draft = itemDrafts[it.name]
      if (draft && draft.trim() && draft.trim() !== it.name) {
        onRenameItem(compartmentId, it.name, draft.trim())
      }
    })
    setEditMode(false)
  }

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    const qty = parseFloat(newQty) || 1
    onAddItem(compartmentId, name, qty, newUnit.trim())
    setNewName(''); setNewQty('1'); setNewUnit('')
    flash(`Added ${qty} × ${name}`)
  }

  const handleVoiceCommand = useCallback((cmd, raw) => {
    if (!cmd) { flash(`Didn't understand: "${raw}"`); return }
    switch (cmd.action) {
      case 'add':
        onAddItem(compartmentId, cmd.item, cmd.qty)
        flash(`✓ Added ${cmd.qty} × ${cmd.item}`)
        break
      case 'remove': {
        const found = items.find(i => i.name.toLowerCase().includes(cmd.item.toLowerCase()))
        if (found) {
          onRemoveItem(compartmentId, found.name, cmd.qty)
          flash(`✓ Removed ${cmd.qty} × ${found.name}`)
        } else {
          const results = onFindItem(cmd.item)
          if (results.length) {
            const comp = COMPARTMENTS.find(c => c.id === results[0].compartmentId)
            flash(`Not here — found in ${comp?.name || results[0].compartmentId}`)
          } else {
            flash(`"${cmd.item}" not found in any compartment`)
          }
        }
        break
      }
      case 'check': {
        const found = items.find(i => i.name.toLowerCase().includes(cmd.item.toLowerCase()))
        if (found) {
          flash(`${found.qty} ${found.unit || 'units'} of ${found.name}`)
        } else {
          const all = onFindItem(cmd.item)
          if (all.length) {
            const total = all.reduce((s, r) => s + r.item.qty, 0)
            flash(`${total} total across ${all.length} compartment${all.length > 1 ? 's' : ''}`)
          } else {
            flash(`"${cmd.item}" not found anywhere`)
          }
        }
        break
      }
      default: flash(`Command not applicable here: "${raw}"`)
    }
  }, [compartmentId, items, onAddItem, onRemoveItem, onFindItem])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        {/* Header */}
        <div className="modal-header">
          <span className="modal-icon">{compartment.icon}</span>
          <h2 className="modal-title">#{compartment.num} — {displayName}</h2>
          <button
            className={`modal-edit-btn ${editMode ? 'modal-edit-btn--active' : ''}`}
            onClick={editMode ? saveEdit : enterEdit}
          >
            {editMode ? 'Save' : 'Edit'}
          </button>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Edit-mode label field */}
        {editMode && (
          <div className="modal-label-row">
            <label className="modal-label-hint">Compartment name</label>
            <input
              className="add-input modal-title-input"
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              placeholder={compartment.name}
            />
          </div>
        )}

        {feedback && <div className="modal-feedback">{feedback}</div>}

        {/* Item list */}
        <div className="item-list">
          {items.length === 0 ? (
            <p className="item-empty">No items yet. Add one below or use the voice button.</p>
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
                  <button className="qty-btn" onClick={() => onSetQty(compartmentId, item.name, item.qty - 1)}>−</button>
                  <span className="item-qty">{item.qty}</span>
                  <button className="qty-btn" onClick={() => onSetQty(compartmentId, item.name, item.qty + 1)}>+</button>
                  <button className="del-btn" onClick={() => onDeleteItem(compartmentId, item.name)} aria-label="Delete">🗑</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add form — hidden in edit mode */}
        {!editMode && (
          <>
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
                type="number" min="0" step="1" placeholder="Qty"
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
            <VoiceButton onCommand={handleVoiceCommand} context='Try: "Add 3 cans of beans" · "Remove 1 flare"' />
          </>
        )}
      </div>
    </div>
  )
}
