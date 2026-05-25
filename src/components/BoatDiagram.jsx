import { COMPARTMENTS } from '../data/compartments'

// Circle positions as percentage of image dimensions (2707 × 767)
const POSITIONS = {
  1:  { px: 78.9, py: 48.6 },
  2:  { px: 70.6, py: 48.0 },
  3:  { px: 67.9, py: 42.2 },
  4:  { px: 67.9, py: 55.3 },
  5:  { px: 56.3, py: 11.1 },
  6:  { px: 56.5, py: 25.6 },
  7:  { px: 56.6, py: 39.5 },
  8:  { px: 58.1, py: 84.1 },
  9:  { px: 51.9, py: 11.1 },
  10: { px: 51.9, py: 22.5 },
  11: { px: 50.0, py: 88.8 },
  12: { px: 48.4, py: 11.1 },
  13: { px: 48.1, py: 25.7 },
  14: { px: 48.0, py: 40.6 },
  15: { px: 44.1, py: 15.3 },
  16: { px: 44.2, py: 28.6 },
  17: { px: 42.8, py: 61.9 },
  18: { px: 38.2, py: 29.8 },
  19: { px: 36.9, py: 49.5 },
  20: { px: 27.8, py: 29.0 },
  21: { px: 19.9, py: 49.1 },
  22: { px: 11.5, py: 29.0 },
  23: { px: 11.6, py: 67.4 },
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
            aspectRatio: '2707 / 767',
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
