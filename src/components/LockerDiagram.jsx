import { LOCKERS, LOCKER_AREAS } from '../data/lockers'

// Positions as % of image (2688 × 1531), bow=right, stern=left, stbd=top, port=bottom
// Derived from pixel-detection of yellow label blobs in boat-plan.png via scipy + OCR
const POSITIONS = {
  'lock-1':  { px: 79.1, py: 46.1 },
  'lock-2':  { px: 70.7, py: 45.8 },
  'lock-3':  { px: 68.0, py: 42.9 },
  'lock-4':  { px: 68.0, py: 49.3 },
  'lock-5':  { px: 56.3, py: 27.6 },
  'lock-6':  { px: 56.5, py: 34.8 },
  'lock-7':  { px: 56.6, py: 41.7 },
  'lock-8':  { px: 58.1, py: 63.6 },
  'lock-9':  { px: 51.9, py: 27.5 },
  'lock-10': { px: 51.8, py: 33.2 },
  'lock-11': { px: 50.0, py: 66.0 },
  'lock-12': { px: 48.3, py: 27.5 },
  'lock-13': { px: 48.1, py: 34.8 },
  'lock-14': { px: 47.9, py: 42.2 },
  'lock-15': { px: 44.0, py: 29.6 },
  'lock-16': { px: 44.0, py: 36.3 },
  'lock-17': { px: 42.7, py: 52.8 },
  'lock-18': { px: 38.1, py: 36.9 },
  'lock-19': { px: 36.8, py: 46.6 },
  'lock-20': { px: 27.6, py: 36.4 },
  'lock-21': { px: 19.7, py: 46.4 },
  'lock-22': { px: 11.2, py: 36.4 },
  'lock-23': { px: 11.3, py: 55.5 },
}

// 1531/2688 expressed as a percentage for the padding-bottom aspect-ratio trick
const ASPECT_PCT = (1531 / 2688) * 100  // ≈ 56.96%

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
            src="/boat-plan.png"
            alt="Catalina 445 interior layout"
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
