/**
 * BoatDiagram — renders the Catalina 445 floor plan with interactive compartment circles.
 *
 * The boat image (public/boat-plan.png) is extracted from the official PDF.
 * Circle positions (POSITIONS) are stored as % of image dimensions so they
 * stay accurate at any zoom level. A ResizeObserver watches the container and
 * scales the diagram to fill it on iPad, while enforcing a MIN_W on phones
 * (making the diagram horizontally scrollable rather than tiny).
 *
 * Each circle shows the compartment number and a badge with total item count.
 * Circles are gold when stocked, outline-only when empty.
 *
 * Below the diagram, a text list of all compartments provides an alternative
 * tap target and shows item counts.
 */
import { useRef, useState, useEffect } from 'react'
import { COMPARTMENTS } from '../data/compartments'

// Circle positions as percentage of image dimensions
// Detected from yellow sticker positions in 445 Compartments.pdf (OCR + pixel analysis)
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

// Image aspect ratio: 2707 × 1275 (cropped from 2688 × 1531)
const ASPECT = 1275 / 2707
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
