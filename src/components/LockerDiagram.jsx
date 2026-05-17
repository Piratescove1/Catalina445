import { LOCKERS, LOCKER_AREAS } from '../data/lockers'

// Positions as % of image (2640 × 1797), bow=right, stern=left, stbd=top, port=bottom
// Cropped from SVTwoHappyDrawers and Lockers.pdf to remove 3/4 of whitespace margins
const POSITIONS = {
  'lock-1':  { px: 70.6, py: 45.2 },
  'lock-2':  { px: 70.6, py: 50.6 },
  'lock-3':  { px: 68.3, py: 41.0 },
  'lock-4':  { px: 68.3, py: 56.0 },
  'lock-5':  { px: 66.2, py: 58.5 },
  'lock-6':  { px: 64.3, py: 58.4 },
  'lock-7':  { px: 61.7, py: 54.5 },
  'lock-8':  { px: 61.6, py: 61.2 },
  'lock-9':  { px: 60.6, py: 46.5 },
  'lock-10': { px: 58.2, py: 58.0 },
  'lock-11': { px: 58.0, py: 63.8 },
  'lock-12': { px: 50.1, py: 58.4 },
  'lock-13': { px: 47.7, py: 30.5 },
  'lock-14': { px: 46.1, py: 63.7 },
  'lock-15': { px: 46.0, py: 58.7 },
  'lock-16': { px: 43.9, py: 31.1 },
  'lock-17': { px: 43.8, py: 39.3 },
  'lock-18': { px: 35.4, py: 63.8 },
  'lock-19': { px: 32.3, py: 34.0 },
  'lock-20': { px: 31.5, py: 63.0 },
  'lock-21': { px: 29.1, py: 34.0 },
  'lock-22': { px: 28.3, py: 63.3 },
  'lock-23': { px: 26.0, py: 48.9 },
}

// 1797/2640 expressed as a percentage for the padding-bottom aspect-ratio trick
const ASPECT_PCT = (1797 / 2640) * 100  // ≈ 68.07%

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
