import { useState, useCallback } from 'react'
import { COMPARTMENTS } from '../data/compartments'
import VoiceButton from './VoiceButton'

function ItemRow({ item, onSetQty, onDelete, onRename }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(item.name)

  const commit = () => {
    if (draft.trim() && draft.trim() !== item.name) onRename(item.name, draft.trim())
    setEditing(false)
  }

  return (
    <div className="item-row">
      {editing ? (
        <>
          <input
            className="add-input item-rename-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus
          />
          <button className="item-rename-save" onClick={commit}>Save</button>
          <button className="item-rename-cancel" onClick={() => setEditing(false)}>✕</button>
        </>
      ) : (
        <>
          <span className="item-name">{item.name}</span>
          {item.unit && <span className="item-unit">{item.unit}</span>}
          <div className="item-controls">
            <button className="item-edit-btn" onClick={() => { setDraft(item.name); setEditing(true) }} aria-label="Rename">✏️</button>
            <button className="qty-btn" onClick={() => onSetQty(item.name, item.qty - 1)}>−</button>
            <span className="item-qty">{item.qty}</span>
            <button className="qty-btn" onClick={() => onSetQty(item.name, item.qty + 1)}>+</button>
            <button className="del-btn" onClick={() => onDelete(item.name)} aria-label="Delete">🗑</button>
          </div>
        </>
      )}
    </div>
  )
}

export default function CompartmentModal({
  compartmentId, inventory, onClose,
  onAddItem, onRemoveItem, onSetQty, onDeleteItem, onRenameItem, onFindItem,
  label, onSetLabel,
}) {
  const compartment = COMPARTMENTS.find(c => c.id === compartmentId)
  if (!compartment) return null
  const items = inventory[compartmentId] || []
  const displayName = label || compartment.name

  const [newName,     setNewName]     = useState('')
  const [newQty,      setNewQty]      = useState('1')
  const [newUnit,     setNewUnit]     = useState('')
  const [feedback,    setFeedback]    = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft,   setTitleDraft]  = useState(displayName)

  const flash = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000) }

  const commitTitle = () => {
    if (titleDraft.trim()) onSetLabel(compartmentId, titleDraft.trim())
    setEditingTitle(false)
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
      default:
        flash(`Command not applicable here: "${raw}"`)
    }
  }, [compartmentId, items, onAddItem, onRemoveItem, onFindItem])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-icon">{compartment.icon}</span>
          <div className="modal-title-wrap">
            <span className="modal-num">#{compartment.num}</span>
            {editingTitle ? (
              <div className="modal-title-edit">
                <input
                  className="add-input modal-title-input"
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                  autoFocus
                />
                <button className="item-rename-save" onClick={commitTitle}>Save</button>
                <button className="item-rename-cancel" onClick={() => setEditingTitle(false)}>✕</button>
              </div>
            ) : (
              <button className="modal-title-btn" onClick={() => { setTitleDraft(displayName); setEditingTitle(true) }}>
                {displayName} ✏️
              </button>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {feedback && <div className="modal-feedback">{feedback}</div>}

        <div className="item-list">
          {items.length === 0 ? (
            <p className="item-empty">No items yet. Add one below or use the voice button.</p>
          ) : (
            items.map(item => (
              <ItemRow
                key={item.name}
                item={item}
                onSetQty={(name, qty) => onSetQty(compartmentId, name, qty)}
                onDelete={(name) => onDeleteItem(compartmentId, name)}
                onRename={(oldName, newName) => onRenameItem(compartmentId, oldName, newName)}
              />
            ))
          )}
        </div>

        <div className="add-form">
          <input
            className="add-input add-input--name"
            type="text"
            placeholder="Item name"
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

        <VoiceButton onCommand={handleVoiceCommand} context="Try: "Add 3 cans of beans" · "Remove 1 flare"" />
      </div>
    </div>
  )
}
