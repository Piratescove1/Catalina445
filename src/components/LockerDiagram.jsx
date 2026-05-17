import { LOCKERS, LOCKER_AREAS } from '../data/lockers'

// Positions as % of image (2418 × 1136), bow=right, stern=left, stbd=top, port=bottom
// Cropped from SVTwoHappyDrawers and Lockers.pdf removing 75% of whitespace margins
const POSITIONS = {
  'lock-1':  { px: 72.6, py: 46.6 },
  'lock-2':  { px: 72.6, py: 55.0 },
  'lock-3':  { px: 70.1, py: 39.8 },
  'lock-4':  { px: 70.1, py: 63.6 },
  'lock-5':  { px: 67.8, py: 67.5 },
  'lock-6':  { px: 65.6, py: 67.3 },
  'lock-7':  { px: 62.8, py: 61.2 },
  'lock-8':  { px: 62.7, py: 71.8 },
  'lock-9':  { px: 61.6, py: 48.6 },
  'lock-10': { px: 59.0, py: 66.8 },
  'lock-11': { px: 58.8, py: 75.9 },
  'lock-12': { px: 50.2, py: 67.3 },
  'lock-13': { px: 47.5, py: 23.2 },
  'lock-14': { px: 45.8, py: 75.8 },
  'lock-15': { px: 45.7, py: 67.9 },
  'lock-16': { px: 43.3, py: 24.1 },
  'lock-17': { px: 43.2, py: 37.2 },
  'lock-18': { px: 34.1, py: 75.9 },
  'lock-19': { px: 30.7, py: 28.8 },
  'lock-20': { px: 29.8, py: 74.6 },
  'lock-21': { px: 27.2, py: 28.8 },
  'lock-22': { px: 26.4, py: 75.2 },
  'lock-23': { px: 23.9, py: 52.4 },
}

// 1136/2418 expressed as a percentage for the padding-bottom aspect-ratio trick
const ASPECT_PCT = (1136 / 2418) * 100  // ≈ 46.98%

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
