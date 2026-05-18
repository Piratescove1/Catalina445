import { useState } from 'react'
import { PROVISION_CATEGORIES } from '../data/provisions'

function AddItemRow({ onAdd }) {
  const [name, setName] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim())
    setName('')
  }

  return (
    <div className="prov-add-row">
      <input
        className="add-input add-input--name"
        placeholder="Add custom item…"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
      />
      <button className="add-btn" onClick={handleAdd} disabled={!name.trim()}>Add</button>
    </div>
  )
}

export default function ProvisionsScreen({ items, toggleItem, addItem, deleteItem, clearList }) {
  const [showListOnly, setShowListOnly] = useState(false)

  const checkedCount = items.filter(it => it.checked).length

  // Group items by category, optionally filtering to checked only
  const displayed = showListOnly ? items.filter(it => it.checked) : items
  const categories = ['My Items', ...PROVISION_CATEGORIES].filter(cat =>
    displayed.some(it => it.category === cat)
  )

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">🛒 Provisions</h1>
          <p className="screen-subtitle">
            {checkedCount === 0
              ? 'Check items you need to buy'
              : `${checkedCount} item${checkedCount !== 1 ? 's' : ''} on shopping list`}
          </p>
        </div>
        {checkedCount > 0 && (
          <button className="prov-clear-btn" onClick={clearList}>Clear list</button>
        )}
      </header>

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

      <div className="screen-body">
        {showListOnly && checkedCount === 0 && (
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
                  <button
                    className={`prov-check ${item.checked ? 'prov-check--on' : ''}`}
                    onClick={() => toggleItem(item.id)}
                    aria-label={item.checked ? 'Remove from list' : 'Add to list'}
                  >
                    {item.checked ? '✓' : ''}
                  </button>
                  <span className="prov-name">{item.name}</span>
                  {item.custom && (
                    <button
                      className="prov-delete"
                      onClick={() => deleteItem(item.id)}
                      aria-label="Delete item"
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
          )
        })}

        <AddItemRow onAdd={addItem} />
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
