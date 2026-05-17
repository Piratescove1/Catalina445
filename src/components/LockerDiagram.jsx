import { useRef, useState, useEffect } from 'react'
import { LOCKERS, LOCKER_AREAS } from '../data/lockers'

// Positions as % of image (2688 × 1531), bow=right, stern=left, stbd=top, port=bottom
// Each value was read directly from the boat-plan.png yellow-number positions
const POSITIONS = {
  'lock-1':  { px: 91.0, py: 50.0 },
  'lock-2':  { px: 82.5, py: 55.0 },
  'lock-3':  { px: 79.5, py: 42.0 },
  'lock-4':  { px: 82.0, py: 63.0 },
  'lock-5':  { px: 70.5, py: 34.0 },
  'lock-6':  { px: 70.0, py: 18.5 },
  'lock-7':  { px: 67.5, py: 46.5 },
  'lock-8':  { px: 65.0, py: 71.5 },
  'lock-9':  { px: 69.0, py: 19.5 },
  'lock-10': { px: 67.0, py: 33.5 },
  'lock-11': { px: 57.0, py: 72.0 },
  'lock-12': { px: 67.0, py: 14.5 },
  'lock-13': { px: 65.0, py: 39.0 },
  'lock-14': { px: 63.0, py: 48.0 },
  'lock-15': { px: 63.0, py: 19.5 },
  'lock-16': { px: 60.0, py: 38.5 },
  'lock-17': { px: 48.0, py: 65.5 },
  'lock-18': { px: 57.5, py: 44.5 },
  'lock-19': { px: 51.0, py: 54.0 },
  'lock-20': { px: 38.0, py: 31.0 },
  'lock-21': { px: 34.0, py: 50.0 },
  'lock-22': { px: 18.0, py: 24.5 },
  'lock-23': { px: 18.0, py: 69.5 },
}

// Image native aspect ratio: 1531 / 2688
const ASPECT = 1531 / 2688
const MIN_W  = 800

function itemCount(inv, id) {
  return (inv[id] || []).reduce((s, i) => s + i.qty, 0)
}

export default function LockerDiagram({ lockerInventory, onSelect, selected }) {
  const outerRef = useRef(null)
  const [w, setW] = useState(MIN_W)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      setW(Math.max(entries[0].contentRect.width, MIN_W))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const h = Math.round(w * ASPECT)
  const scrollable = w === MIN_W

  return (
    <div className="diagram-wrap">
      <div className="diagram-scroll-outer" ref={outerRef}>
        <div className="diagram-inner" style={{ width: w, height: h, position: 'relative' }}>

          {/* Actual boat floor plan */}
          <img
            src="/boat-plan.png"
            alt="Catalina 445 interior layout"
            width={w}
            height={h}
            style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
            draggable={false}
          />

          {/* Clickable circles overlaid on floor plan */}
          {LOCKERS.map(locker => {
            const pos = POSITIONS[locker.id]
            if (!pos) return null
            const left  = (pos.px / 100) * w
            const top   = (pos.py / 100) * h
            const count = itemCount(lockerInventory, locker.id)
            const isSelected = selected === locker.id
            const hasItems   = count > 0
            return (
              <button
                key={locker.id}
                className={`circle-btn ${isSelected ? 'circle-btn--active' : ''} ${hasItems ? 'circle-btn--stocked' : ''}`}
                style={{ left, top }}
                onClick={() => onSelect(locker.id)}
                aria-label={locker.name}
              >
                <span className="circle-num">{locker.num}</span>
                {hasItems && <span className="circle-badge">{count > 99 ? '99+' : count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {scrollable && <p className="scroll-hint">← scroll to see full boat →</p>}

      {/* Grouped list below diagram */}
      <div className="comp-list">
        {LOCKER_AREAS.map(area => {
          const group = LOCKERS.filter(l => l.area === area)
          if (!group.length) return null
          return (
            <div key={area}>
              <p className="locker-area-header">{area}</p>
              {group.map(locker => {
                const count = itemCount(lockerInventory, locker.id)
                return (
                  <button
                    key={locker.id}
                    className={`comp-row ${selected === locker.id ? 'comp-row--active' : ''}`}
                    onClick={() => onSelect(locker.id)}
                  >
                    <span className="comp-num">{locker.num}</span>
                    <span className="comp-icon">{locker.icon}</span>
                    <span className="comp-name">{locker.name}</span>
                    {count > 0
                      ? <span className="comp-count">{count} items</span>
                      : <span className="comp-empty">empty</span>
                    }
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
