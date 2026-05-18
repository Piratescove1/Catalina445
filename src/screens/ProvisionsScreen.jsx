import { useState } from 'react'

function AddItemRow({ allCategories, onAdd }) {
  const [name, setName] = useState('')
  const [cat,  setCat]  = useState(allCategories[0] ?? 'My Items')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim(), cat)
    setName('')
  }

  return (
    <div className="prov-add-row">
      <input
        className="add-input add-input--name"
        placeholder="Add item…"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
      />
      <select
        className="prov-cat-select"
        value={cat}
        onChange={e => setCat(e.target.value)}
      >
        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button className="add-btn" onClick={handleAdd} disabled={!name.trim()}>Add</button>
    </div>
  )
}

// Single item row — normal (shopping) mode
function ItemRow({ item, onToggle }) {
  return (
    <div className={`prov-item ${item.checked ? 'prov-item--checked' : ''}`}>
      <button
        className={`prov-check ${item.checked ? 'prov-check--on' : ''}`}
        onClick={() => onToggle(item.id)}
        aria-label={item.checked ? 'Remove from list' : 'Add to list'}
      >
        {item.checked ? '✓' : ''}
      </button>
      <span className="prov-name">{item.name}</span>
    </div>
  )
}

// Single item row — edit mode (rename / reorder / delete)
function EditItemRow({ item, isFirst, isLast, onRename, onMove, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(item.name)

  const commitRename = () => {
    if (draft.trim()) onRename(item.id, draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="prov-item prov-item--editing">
        <input
          className="add-input prov-item-rename-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
        />
        <button className="prov-cat-action prov-cat-action--save" onClick={commitRename}>Save</button>
        <button className="prov-cat-action" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    )
  }

  return (
    <div className="prov-item prov-item--edit-mode">
      <div className="prov-cat-arrows">
        <button className="prov-cat-arrow" onClick={() => onMove(item.id, -1)} disabled={isFirst} aria-label="Move up">▲</button>
        <button className="prov-cat-arrow" onClick={() => onMove(item.id,  1)} disabled={isLast}  aria-label="Move down">▼</button>
      </div>
      <span className="prov-name">{item.name}</span>
      <button className="prov-cat-action" onClick={() => { setDraft(item.name); setEditing(true) }}>Rename</button>
      <button className="prov-delete prov-delete--visible" onClick={() => onDelete(item.id)} aria-label="Delete">✕</button>
    </div>
  )
}

function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }) {
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

export default function ProvisionsScreen({ items, categories, toggleItem, addItem, deleteItem, renameItem, moveItem, clearList, resetDefaults }) {
  const [showListOnly, setShowListOnly] = useState(false)
  const [editMode,     setEditMode]     = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const checkedCount = items.filter(it => it.checked).length
  const displayed    = showListOnly ? items.filter(it => it.checked) : items
  const visibleCats  = categories.filter(cat => displayed.some(it => it.category === cat))

  return (
    <div className="screen">
      {confirmReset && (
        <ConfirmDialog
          title="Restore Default List?"
          body="This will remove all custom items and restore all original items unchecked. Your shopping list and any custom items will be cleared."
          confirmLabel="Yes, restore defaults"
          onConfirm={() => { setConfirmReset(false); resetDefaults() }}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      <header className="screen-header">
        <div>
          <h1 className="screen-title">🛒 Provisions</h1>
          <p className="screen-subtitle">
            {checkedCount === 0
              ? 'Check items you need to buy'
              : `${checkedCount} item${checkedCount !== 1 ? 's' : ''} on shopping list`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {checkedCount > 0 && !editMode && (
            <button className="prov-clear-btn" onClick={clearList}>Clear list</button>
          )}
          <button
            className={`prov-edit-btn ${editMode ? 'prov-edit-btn--active' : ''}`}
            onClick={() => setEditMode(e => !e)}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </header>

      {editMode && (
        <div className="prov-edit-bar">
          <span className="prov-edit-hint">Rename, reorder or delete any item</span>
          <button className="prov-reset-btn" onClick={() => setConfirmReset(true)}>Restore defaults</button>
        </div>
      )}

      {!editMode && (
        <div className="prov-filter-row">
          <button
            className={`prov-filter-btn ${!showListOnly ? 'prov-filter-btn--active' : ''}`}
            onClick={() => setShowListOnly(false)}
          >All items</button>
          <button
            className={`prov-filter-btn ${showListOnly ? 'prov-filter-btn--active' : ''}`}
            onClick={() => setShowListOnly(true)}
          >Shopping list {checkedCount > 0 ? `(${checkedCount})` : ''}</button>
        </div>
      )}

      <div className="screen-body">
        {showListOnly && !editMode && checkedCount === 0 && (
          <p className="prov-empty">No items on the list yet. Tap "All items" and check what you need.</p>
        )}

        {visibleCats.map(cat => {
          const catItems = displayed.filter(it => it.category === cat)
          if (!catItems.length) return null
          return (
            <div key={cat}>
              <p className="prov-category-header">{cat}</p>
              {catItems.map((item, idx) =>
                editMode ? (
                  <EditItemRow
                    key={item.id}
                    item={item}
                    isFirst={idx === 0}
                    isLast={idx === catItems.length - 1}
                    onRename={renameItem}
                    onMove={moveItem}
                    onDelete={deleteItem}
                  />
                ) : (
                  <ItemRow key={item.id} item={item} onToggle={toggleItem} />
                )
              )}
            </div>
          )
        })}

        <AddItemRow allCategories={categories} onAdd={addItem} />
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
