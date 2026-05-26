import { COMPARTMENTS } from '../data/compartments'

// Circle positions as percentage of image dimensions (2707 × 905)
// Re-rendered from 445 Compartments.pdf; positions 1-23 from PDF text layer,
// 24-25 placed in the aft stern area per updated diagram
const POSITIONS = {
  1:  { px: 79.2, py: 48.0 },
  2:  { px: 70.7, py: 47.6 },
  3:  { px: 68.1, py: 42.6 },
  4:  { px: 68.1, py: 53.6 },
  5:  { px: 56.3, py: 16.5 },
  6:  { px: 56.5, py: 28.7 },
  7:  { px: 56.7, py: 40.4 },
  8:  { px: 58.2, py: 78.1 },
  9:  { px: 51.9, py: 16.4 },
  10: { px: 51.9, py: 26.0 },
  11: { px: 50.0, py: 81.9 },
  12: { px: 48.4, py: 16.4 },
  13: { px: 48.2, py: 28.8 },
  14: { px: 48.0, py: 41.4 },
  15: { px: 44.1, py: 19.9 },
  16: { px: 44.1, py: 31.4 },
  17: { px: 42.7, py: 59.3 },
  18: { px: 38.1, py: 32.3 },
  19: { px: 36.9, py: 48.8 },
  20: { px: 27.6, py: 31.5 },
  21: { px: 19.7, py: 48.6 },
  22: { px: 11.3, py: 31.6 },
  23: { px: 11.4, py: 64.1 },
  24: { px:  7.5, py: 28.0 },
  25: { px:  7.5, py: 57.0 },
}

function itemCount(inventory, id) {
  return (inventory[id] || []).reduce((s, i) => s + i.qty, 0)
}

export default function BoatDiagram({ inventory, onSelect, selected, getLabel }) {
  return (
    <div className="diagram-wrap">
      <div className="diagram-scroll-outer">
        <div
          className="diagram-inner"
          style={{
            position: 'relative',
            width: '100%',
            minWidth: 1000,
            aspectRatio: '2707 / 905',
          }}
        >
          <img
            src="/boat-plan.png"
            alt="Catalina 445 floor plan"
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: '100%',
              display: 'block',
              userSelect: 'none',
            }}
            draggable={false}
          />

          {COMPARTMENTS.map(c => {
            const pos = POSITIONS[c.num]
            if (!pos) return null
            const isSelected = selected === c.id
            const count = itemCount(inventory, c.id)
            const hasItems = count > 0
            return (
              <button
                key={c.id}
                className={`circle-btn ${isSelected ? 'circle-btn--active' : ''} ${hasItems ? 'circle-btn--stocked' : ''}`}
                style={{ left: `${pos.px}%`, top: `${pos.py}%` }}
                onClick={() => onSelect(c.id)}
                aria-label={`Compartment ${c.num}: ${getLabel ? getLabel(c.id, c.name) : c.name}`}
              >
                <span className="circle-num">{c.num}</span>
                {hasItems && <span className="circle-badge">{count > 99 ? '99+' : count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <p className="scroll-hint">← scroll horizontally on small screens →</p>

      <div className="comp-list">
        {COMPARTMENTS.map(c => {
          const count = itemCount(inventory, c.id)
          const isSelected = selected === c.id
          return (
            <button
              key={c.id}
              className={`comp-row ${isSelected ? 'comp-row--active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <span className="comp-num">{c.num}</span>
              <span className="comp-icon">{c.icon}</span>
              <span className="comp-name">{getLabel ? getLabel(c.id, c.name) : c.name}</span>
              {count > 0
                ? <span className="comp-count">{count} items</span>
                : <span className="comp-empty">empty</span>
              }
            </button>
          )
        })}
      </div>
    </div>
  )
}
