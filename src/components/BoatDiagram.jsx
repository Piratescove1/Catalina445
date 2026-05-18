import { COMPARTMENTS } from '../data/compartments'

// Circle positions as percentage of image dimensions (2707 × 810)
const POSITIONS = {
  1:  { px: 78.9, py: 54.5 },
  2:  { px: 70.6, py: 54.0 },
  3:  { px: 67.9, py: 48.5 },
  4:  { px: 67.9, py: 60.8 },
  5:  { px: 56.3, py: 19.0 },
  6:  { px: 56.5, py: 32.7 },
  7:  { px: 56.6, py: 46.0 },
  8:  { px: 48.1, py: 32.9 },
  9:  { px: 51.9, py: 19.0 },
  10: { px: 51.9, py: 29.8 },
  11: { px: 48.0, py: 46.9 },
  12: { px: 48.4, py: 19.0 },
  13: { px: 50.0, py: 92.6 },
  14: { px: 58.1, py: 88.1 },
  15: { px: 44.1, py: 23.0 },
  16: { px: 44.2, py: 35.6 },
  17: { px: 42.8, py: 67.2 },
  18: { px: 38.2, py: 36.7 },
  19: { px: 36.9, py: 55.4 },
  20: { px: 27.8, py: 36.0 },
  21: { px: 19.9, py: 55.1 },
  22: { px: 11.5, py: 36.0 },
  23: { px: 11.6, py: 72.4 },
}

function itemCount(inventory, id) {
  return (inventory[id] || []).reduce((s, i) => s + i.qty, 0)
}

export default function BoatDiagram({ inventory, onSelect, selected }) {
  return (
    <div className="diagram-wrap">
      <div className="diagram-scroll-outer">
        <div
          className="diagram-inner"
          style={{
            position: 'relative',
            width: '100%',
            minWidth: 1000,
            aspectRatio: '2707 / 810',
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
                aria-label={`Compartment ${c.num}: ${c.name}`}
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
              <span className="comp-name">{c.name}</span>
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
