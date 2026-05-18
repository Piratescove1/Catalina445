import { useState } from 'react'
import { PROVISION_CATEGORIES } from '../data/provisions'

const ALL_CATEGORIES = ['My Items', ...PROVISION_CATEGORIES]

function AddItemRow({ onAdd, editMode }) {
  const [name, setName]     = useState('')
  const [cat,  setCat]      = useState('My Items')

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
      {editMode && (
        <select
          className="prov-cat-select"
          value={cat}
          onChange={e => setCat(e.target.value)}
        >
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      <button className="add-btn" onClick={handleAdd} disabled={!name.trim()}>Add</button>
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

export default function ProvisionsScreen({ items, toggleItem, addItem, deleteItem, clearList, resetDefaults }) {
  const [showListOnly,    setShowListOnly]    = useState(false)
  const [editMode,        setEditMode]        = useState(false)
  const [confirmReset,    setConfirmReset]    = useState(false)

  const checkedCount = items.filter(it => it.checked).length

  const displayed = showListOnly ? items.filter(it => it.checked) : items
  const categories = ALL_CATEGORIES.filter(cat => displayed.some(it => it.category === cat))

  return (
    <div className="screen">
      {confirmReset && (
        <ConfirmDialog
          title="Restore Default List?"
          body="This will remove all your custom items and restore all original items unchecked. Your shopping list will be cleared."
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
          <span className="prov-edit-hint">Tap ✕ to remove any item</span>
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

        {categories.map(cat => {
          const catItems = displayed.filter(it => it.category === cat)
          if (!catItems.length) return null
          return (
            <div key={cat}>
              <p className="prov-category-header">{cat}</p>
              {catItems.map(item => (
                <div key={item.id} className={`prov-item ${item.checked ? 'prov-item--checked' : ''}`}>
                  {!editMode && (
                    <button
                      className={`prov-check ${item.checked ? 'prov-check--on' : ''}`}
                      onClick={() => toggleItem(item.id)}
                      aria-label={item.checked ? 'Remove from list' : 'Add to list'}
                    >
                      {item.checked ? '✓' : ''}
                    </button>
                  )}
                  <span className="prov-name">{item.name}</span>
                  {editMode && (
                    <button
                      className="prov-delete prov-delete--visible"
                      onClick={() => deleteItem(item.id)}
                      aria-label="Delete item"
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
          )
        })}

        <AddItemRow onAdd={addItem} editMode={editMode} />
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
