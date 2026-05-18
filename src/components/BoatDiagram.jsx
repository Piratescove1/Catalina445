import { COMPARTMENTS } from '../data/compartments'

// Circle positions as percentage of image dimensions (2707 × 1275)
const POSITIONS = {
  1:  { px: 78.9, py: 34.6 },
  2:  { px: 70.6, py: 34.3 },
  3:  { px: 67.9, py: 30.8 },
  4:  { px: 67.9, py: 38.6 },
  5:  { px: 56.3, py: 12.1 },
  6:  { px: 56.5, py: 20.8 },
  7:  { px: 56.6, py: 29.2 },
  8:  { px: 48.1, py: 20.9 },
  9:  { px: 51.9, py: 12.1 },
  10: { px: 51.9, py: 18.9 },
  11: { px: 48.0, py: 29.8 },
  12: { px: 48.4, py: 12.1 },
  13: { px: 50.0, py: 58.8 },
  14: { px: 58.1, py: 56.0 },
  15: { px: 44.1, py: 14.6 },
  16: { px: 44.2, py: 22.6 },
  17: { px: 42.8, py: 42.7 },
  18: { px: 38.2, py: 23.3 },
  19: { px: 36.9, py: 35.2 },
  20: { px: 27.8, py: 22.9 },
  21: { px: 19.9, py: 35.0 },
  22: { px: 11.5, py: 22.9 },
  23: { px: 11.6, py: 46.0 },
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
            minWidth: 1100,
            aspectRatio: '2707 / 1275',
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
