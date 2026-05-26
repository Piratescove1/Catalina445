import { COMPARTMENTS } from '../data/compartments'

// Circle positions as percentage of image dimensions (2707 × 989)
// Rendered from updated 445 Compartmets PDF.pdf; all 25 positions from PDF text layer
const POSITIONS = {
  1:  { px: 79.2, py: 52.4 },
  2:  { px: 70.7, py: 52.0 },
  3:  { px: 68.1, py: 47.5 },
  4:  { px: 68.1, py: 57.6 },
  5:  { px: 56.3, py: 23.6 },
  6:  { px: 56.5, py: 34.8 },
  7:  { px: 56.7, py: 45.5 },
  8:  { px: 58.2, py: 80.0 },
  9:  { px: 51.9, py: 23.5 },
  10: { px: 51.9, py: 32.3 },
  11: { px: 50.0, py: 83.4 },
  12: { px: 48.4, py: 23.5 },
  13: { px: 48.2, py: 34.8 },
  14: { px: 48.0, py: 46.4 },
  15: { px: 44.1, py: 26.7 },
  16: { px: 44.1, py: 37.2 },
  17: { px: 42.7, py: 62.8 },
  18: { px: 38.1, py: 38.1 },
  19: { px: 36.9, py: 53.2 },
  20: { px: 27.6, py: 37.3 },
  21: { px: 19.7, py: 52.9 },
  22: { px: 11.3, py: 37.4 },
  23: { px: 11.4, py: 67.2 },
  24: { px:  6.6, py: 37.4 },
  25: { px:  6.8, py: 66.9 },
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
            aspectRatio: '2707 / 989',
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
