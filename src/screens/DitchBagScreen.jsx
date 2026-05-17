import { useState } from 'react'

function ConfirmDialog({ title, body, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <p className="dialog-title">{title}</p>
        <p className="dialog-body">{body}</p>
        <div className="dialog-btns">
          <button className="dialog-btn dialog-btn--danger" onClick={onConfirm}>{confirmLabel}</button>
          <button className="dialog-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Abandon Ship SOP ─────────────────────────────────────

function SopSection({ sop, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(sop)

  const handleSave = () => { onSave(draft); setEditing(false) }
  const handleEdit = () => { setDraft(sop); setEditing(true) }

  if (editing) {
    return (
      <div className="ditch-sop-card">
        <p className="ditch-sop-label">ABANDON SHIP SOP</p>
        <textarea
          className="ditch-sop-textarea"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={10}
          placeholder={`1. Don life jackets — everyone on deck\n2. Grab ditch bag\n3. Activate EPIRB\n4. Send MAYDAY on VHF Ch 16\n5. Launch life raft on windward side\n6. Step UP into raft — never into water\n7. Cut tether only when raft is fully boarded`}
          autoFocus
        />
        <div className="ditch-sop-btns">
          <button className="ditch-save-btn" onClick={handleSave}>Save SOP</button>
          <button className="ditch-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ditch-sop-card" onClick={handleEdit} title="Tap to edit">
      <div className="ditch-sop-header-row">
        <p className="ditch-sop-label">ABANDON SHIP SOP</p>
        <button className="ditch-edit-btn" onClick={e => { e.stopPropagation(); handleEdit() }}>Edit</button>
      </div>
      {sop ? (
        <pre className="ditch-sop-text">{sop}</pre>
      ) : (
        <p className="ditch-sop-empty">Tap to add your Abandon Ship procedure…</p>
      )}
    </div>
  )
}

// ── Ditch bag item row ────────────────────────────────────

function ItemRow({ item, onToggle, onUpdate, onDelete }) {
  const [editing,       setEditing]       = useState(false)
  const [draftName,     setDraftName]     = useState(item.name)
  const [draftQty,      setDraftQty]      = useState(item.qty)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    if (!draftName.trim()) return
    onUpdate(item.id, { name: draftName.trim(), qty: draftQty })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={`ditch-item ditch-item--editing`}>
        <input
          className="add-input add-input--name"
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          autoFocus
        />
        <input
          className="add-input"
          type="number"
          min="1"
          value={draftQty}
          onChange={e => setDraftQty(Number(e.target.value) || 1)}
          style={{ width: 70 }}
        />
        <button className="ditch-save-btn" onClick={handleSave}>Save</button>
        <button className="ditch-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    )
  }

  return (
    <div className={`ditch-item ${item.packed ? 'ditch-item--packed' : ''}`}>
      {confirmDelete && (
        <ConfirmDialog
          title="Remove Item?"
          body={`Remove "${item.name}" from the ditch bag?`}
          confirmLabel="Yes, remove"
          onConfirm={() => { setConfirmDelete(false); onDelete(item.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <button
        className={`ditch-check ${item.packed ? 'ditch-check--on' : ''}`}
        onClick={() => onToggle(item.id)}
        aria-label={item.packed ? 'Mark not packed' : 'Mark packed'}
      >
        {item.packed ? '✓' : ''}
      </button>
      <span className="ditch-item-name">{item.name}</span>
      <span className="ditch-item-qty">× {item.qty}</span>
      <button className="ditch-item-edit" onClick={() => { setDraftName(item.name); setDraftQty(item.qty); setEditing(true) }}>Edit</button>
      <button className="ditch-item-delete" onClick={() => setConfirmDelete(true)} aria-label="Remove item">✕</button>
    </div>
  )
}

// ── Add item row ──────────────────────────────────────────

function AddItemRow({ onAdd }) {
  const [name, setName] = useState('')
  const [qty,  setQty]  = useState(1)

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim(), qty)
    setName('')
    setQty(1)
  }

  return (
    <div className="ditch-add-row">
      <input
        className="add-input add-input--name"
        placeholder="Item name…"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
      />
      <input
        className="add-input"
        type="number"
        min="1"
        value={qty}
        onChange={e => setQty(Number(e.target.value) || 1)}
        style={{ width: 70 }}
      />
      <button className="ditch-save-btn" onClick={handleAdd}>Add</button>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────

export default function DitchBagScreen({ sop, setSop, items, addItem, updateItem, deleteItem, togglePacked }) {
  const packed = items.filter(it => it.packed).length
  const total  = items.length
  const allPacked = total > 0 && packed === total

  return (
    <div className="screen ditch-screen">
      <header className="ditch-header">
        <div className="ditch-header-sos">🆘</div>
        <div>
          <h1 className="ditch-title">Ditch Bag</h1>
          <p className="ditch-subtitle">
            {total === 0
              ? 'Abandon Ship Kit'
              : allPacked
                ? `All ${total} items packed — ready to go`
                : `${packed} / ${total} items packed`}
          </p>
        </div>
        {allPacked && <div className="ditch-ready-badge">READY</div>}
      </header>

      <div className="screen-body">
        <SopSection sop={sop} onSave={setSop} />

        <div className="ditch-inventory-section">
          <div className="ditch-inventory-header">
            <span className="ditch-inventory-title">Bag Contents</span>
            {total > 0 && (
              <span className="ditch-packed-badge">{packed}/{total} packed</span>
            )}
          </div>

          {items.length === 0 && (
            <p className="ditch-empty">No items yet. Add gear below.</p>
          )}

          <div className="ditch-items-list">
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={togglePacked}
                onUpdate={updateItem}
                onDelete={deleteItem}
              />
            ))}
          </div>

          <AddItemRow onAdd={addItem} />
        </div>
      </div>
    </div>
  )
}
