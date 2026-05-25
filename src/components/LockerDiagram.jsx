import { LOCKERS, LOCKER_AREAS } from '../data/lockers'

// Positions as % of image (2334 × 813), bow=right, stern=left, stbd=top, port=bottom
// Cropped from SVTwoHappyDrawers and Lockers.pdf removing 75% of whitespace margins
const POSITIONS = {
  'lock-1':  { px: 73.4, py: 45.9 },
  'lock-2':  { px: 73.4, py: 57.0 },
  'lock-3':  { px: 70.8, py: 36.8 },
  'lock-4':  { px: 70.8, py: 68.5 },
  'lock-5':  { px: 68.4, py: 73.7 },
  'lock-6':  { px: 66.2, py: 73.4 },
  'lock-7':  { px: 63.3, py: 65.3 },
  'lock-8':  { px: 63.2, py: 79.4 },
  'lock-9':  { px: 62.0, py: 48.5 },
  'lock-10': { px: 59.3, py: 72.8 },
  'lock-11': { px: 59.1, py: 84.9 },
  'lock-12': { px: 50.2, py: 73.4 },
  'lock-13': { px: 47.4, py: 14.6 },
  'lock-14': { px: 45.6, py: 84.8 },
  'lock-15': { px: 45.5, py: 74.2 },
  'lock-16': { px: 43.1, py: 15.9 },
  'lock-17': { px: 43.0, py: 33.3 },
  'lock-18': { px: 33.5, py: 84.9 },
  'lock-19': { px: 30.0, py: 22.1 },
  'lock-20': { px: 29.1, py: 83.2 },
  'lock-21': { px: 26.4, py: 22.1 },
  'lock-22': { px: 25.6, py: 84.0 },
  'lock-23': { px: 23.0, py: 53.6 },
}

function itemCount(inv, id) {
  return (inv[id] || []).reduce((s, i) => s + i.qty, 0)
}

export default function LockerDiagram({ lockerInventory, onSelect, selected, getLabel }) {
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
            minWidth: 1000,
            aspectRatio: '2334 / 813',
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
                aria-label={getLabel ? getLabel(locker.id, locker.name) : locker.name}
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
                    <span className="comp-name">{getLabel ? getLabel(locker.id, locker.name) : locker.name}</span>
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
