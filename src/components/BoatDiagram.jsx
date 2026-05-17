import { useRef, useState, useEffect } from 'react'
import { COMPARTMENTS } from '../data/compartments'

// Circle positions as percentage of image dimensions
// Detected from yellow sticker positions in 445 Compartments.pdf (OCR + pixel analysis)
const POSITIONS = {
  1:  { px: 79.1, py: 46.8 },
  2:  { px: 70.7, py: 46.5 },
  3:  { px: 68.0, py: 43.6 },
  4:  { px: 68.0, py: 50.1 },
  5:  { px: 56.3, py: 28.0 },
  6:  { px: 56.5, py: 35.3 },
  7:  { px: 56.6, py: 42.3 },
  8:  { px: 48.1, py: 35.4 },
  9:  { px: 51.9, py: 28.0 },
  10: { px: 51.9, py: 33.7 },
  11: { px: 48.0, py: 42.8 },
  12: { px: 48.4, py: 28.0 },
  13: { px: 50.0, py: 66.9 },
  14: { px: 58.1, py: 64.6 },
  15: { px: 44.0, py: 30.1 },
  16: { px: 44.1, py: 36.8 },
  17: { px: 42.7, py: 53.5 },
  18: { px: 38.1, py: 37.4 },
  19: { px: 36.8, py: 47.3 },
  20: { px: 27.6, py: 37.0 },
  21: { px: 19.7, py: 47.1 },
  22: { px: 11.2, py: 37.0 },
  23: { px: 11.3, py: 56.3 },
}

// Image aspect ratio: 2688 × 1531
const ASPECT = 1531 / 2688
const MIN_W = 1100  // minimum width — scrollable on phone

function itemCount(inventory, id) {
  return (inventory[id] || []).reduce((s, i) => s + i.qty, 0)
}

export default function BoatDiagram({ inventory, onSelect, selected }) {
  const outerRef = useRef(null)
  const [dims, setDims] = useState({ w: MIN_W, h: Math.round(MIN_W * ASPECT) })

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const containerW = entries[0].contentRect.width
      const w = Math.max(containerW, MIN_W)
      setDims({ w, h: Math.round(w * ASPECT) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { w, h } = dims
  const scrollable = w === MIN_W

  return (
    <div className="diagram-wrap">
      <div className="diagram-scroll-outer" ref={outerRef}>
        <div className="diagram-inner" style={{ width: w, height: h }}>
          <img
            src="/boat-plan.png"
            alt="Catalina 445 floor plan"
            className="boat-img"
            draggable={false}
          />

          {COMPARTMENTS.map(c => {
            const pos = POSITIONS[c.num]
            if (!pos) return null
            const left = (pos.px / 100) * w
            const top  = (pos.py / 100) * h
            const isSelected = selected === c.id
            const count = itemCount(inventory, c.id)
            const hasItems = count > 0

            return (
              <button
                key={c.id}
                className={`circle-btn ${isSelected ? 'circle-btn--active' : ''} ${hasItems ? 'circle-btn--stocked' : ''}`}
                style={{ left, top }}
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

      {scrollable && <p className="scroll-hint">← scroll to see full boat →</p>}

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
