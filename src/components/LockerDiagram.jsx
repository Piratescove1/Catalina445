import { LOCKERS, LOCKER_AREAS } from '../data/lockers'

// Positions as % of image (3334 × 1875), bow=right, stern=left, stbd=top, port=bottom
// Derived from pixel-detection of yellow label blobs in locker-plan.png via scipy + OCR
const POSITIONS = {
  'lock-1':  { px: 69.8, py: 42.9 },
  'lock-2':  { px: 69.8, py: 49.1 },
  'lock-3':  { px: 67.5, py: 38.0 },
  'lock-4':  { px: 67.5, py: 55.4 },
  'lock-5':  { px: 65.6, py: 58.3 },
  'lock-6':  { px: 63.6, py: 58.1 },
  'lock-7':  { px: 60.2, py: 44.5 },
  'lock-8':  { px: 62.0, py: 56.0 },
  'lock-9':  { px: 61.0, py: 60.0 },
  'lock-10': { px: 59.5, py: 64.0 },
  'lock-11': { px: 57.8, py: 57.7 },
  'lock-12': { px: 50.0, py: 58.1 },
  'lock-13': { px: 44.0, py: 36.0 },
  'lock-14': { px: 46.1, py: 58.6 },
  'lock-15': { px: 46.3, py: 64.4 },
  'lock-16': { px: 35.9, py: 64.5 },
  'lock-17': { px: 32.9, py: 29.9 },
  'lock-18': { px: 29.8, py: 29.8 },
  'lock-19': { px: 29.2, py: 63.9 },
  'lock-20': { px: 24.0, py: 28.0 },
  'lock-21': { px: 24.0, py: 65.0 },
  'lock-22': { px: 21.0, py: 28.0 },
  'lock-23': { px: 21.0, py: 65.0 },
}

// 1875/3334 expressed as a percentage for the padding-bottom aspect-ratio trick
const ASPECT_PCT = (1875 / 3334) * 100  // ≈ 56.24%

function itemCount(inv, id) {
  return (inv[id] || []).reduce((s, i) => s + i.qty, 0)
}

export default function LockerDiagram({ lockerInventory, onSelect, selected }) {
  return (
    <div className="diagram-wrap">
      <div className="diagram-scroll-outer">
        {/*
          Padding-bottom trick: the div has no explicit height but its
          padding-bottom is ASPECT_PCT of its own width, giving it the
          correct aspect ratio regardless of screen size. The image and
          all circles are absolutely positioned inside it so they always
          align with the image pixels.
        */}
        <div
          className="diagram-inner"
          style={{
            position: 'relative',
            width: '100%',
            minWidth: 800,
            paddingBottom: `${ASPECT_PCT}%`,
            height: 0,
          }}
        >
          <img
            src="/locker-plan.png"
            alt="Catalina 445 drawers and lockers layout"
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

          {LOCKERS.map(locker => {
            const pos = POSITIONS[locker.id]
            if (!pos) return null
            const count = itemCount(lockerInventory, locker.id)
            const isSelected = selected === locker.id
            const hasItems   = count > 0
            return (
              <button
                key={locker.id}
                className={`circle-btn ${isSelected ? 'circle-btn--active' : ''} ${hasItems ? 'circle-btn--stocked' : ''}`}
                style={{ left: `${pos.px}%`, top: `${pos.py}%` }}
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

      <p className="scroll-hint">← scroll horizontally on small screens →</p>

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
