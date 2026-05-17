import { useRef, useState, useEffect } from 'react'
import { LOCKERS, LOCKER_AREAS } from '../data/lockers'

// Positions as % of SVG viewBox (1000 × 420)
// bow = right (x=100%), stern = left (x=0%), stbd = top (y=0%), port = bottom (y=100%)
const POSITIONS = {
  'lock-1':  { px: 78.7, py: 49.6 },
  'lock-2':  { px: 77.2, py: 56.4 },
  'lock-3':  { px: 72.4, py: 38.2 },
  'lock-4':  { px: 68.5, py: 61.8 },
  'lock-5':  { px: 65.0, py: 62.7 },
  'lock-6':  { px: 63.0, py: 60.0 },
  'lock-7':  { px: 57.5, py: 47.8 },
  'lock-8':  { px: 62.6, py: 67.3 },
  'lock-9':  { px: 60.2, py: 71.5 },
  'lock-10': { px: 58.3, py: 76.0 },
  'lock-11': { px: 56.3, py: 67.3 },
  'lock-12': { px: 57.1, py: 75.1 },
  'lock-13': { px: 57.5, py: 26.9 },
  'lock-14': { px: 52.4, py: 66.9 },
  'lock-15': { px: 52.4, py: 24.2 },
  'lock-16': { px: 42.5, py: 66.9 },
  'lock-17': { px: 42.5, py: 72.7 },
  'lock-18': { px: 47.2, py: 43.6 },
  'lock-19': { px: 33.9, py: 72.4 },
  'lock-20': { px: 45.3, py: 28.2 },
  'lock-21': { px: 29.5, py: 71.8 },
  'lock-22': { px: 46.9, py: 28.2 },
  'lock-23': { px: 27.2, py: 76.0 },
}

const VB_W = 1000
const VB_H = 420
const ASPECT = VB_H / VB_W
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

          {/* SVG boat schematic */}
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width={w}
            height={h}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* Background */}
            <rect width="1000" height="420" fill="#0B1929"/>

            {/* Outer hull */}
            <path
              d="M 52,168 C 52,98 252,52 548,50 C 782,48 940,118 975,210 C 940,302 782,372 548,370 C 252,368 52,322 52,252 Z"
              fill="#0e2035" stroke="#2d5278" strokeWidth="2.5"
            />
            {/* Stern transom */}
            <line x1="52" y1="168" x2="52" y2="252" stroke="#4a7fa5" strokeWidth="5"/>

            {/* Centerline */}
            <line x1="52" y1="210" x2="975" y2="210" stroke="#1a3050" strokeWidth="1" strokeDasharray="14,10"/>

            {/* ── V-BERTH (bow, starboard+port) ── */}
            <path
              d="M 695,128 C 800,108 930,145 975,210 C 930,275 800,312 695,292 Z"
              fill="#132a40" stroke="#2d5278" strokeWidth="1.5"
            />
            <text x="858" y="215" textAnchor="middle" fill="#3a6b9e" fontSize="15" fontWeight="600">V-berth</text>
            {/* V-berth bulkhead */}
            <path d="M 695,128 Q 705,210 695,292" fill="none" stroke="#3a5878" strokeWidth="2" strokeDasharray="5,4"/>

            {/* ── HEAD (stbd, fwd) ── */}
            <rect x="558" y="78" width="135" height="130" rx="5" fill="#132a40" stroke="#2d5278" strokeWidth="1.5"/>
            <text x="625" y="150" textAnchor="middle" fill="#3a6b9e" fontSize="13">Head</text>

            {/* ── GALLEY (stbd, amidships) ── */}
            <rect x="406" y="52" width="148" height="138" rx="5" fill="#132a40" stroke="#2d5278" strokeWidth="1.5"/>
            {/* Stove rings */}
            <circle cx="440" cy="88" r="13" fill="none" stroke="#3a5878" strokeWidth="1.5"/>
            <circle cx="472" cy="88" r="13" fill="none" stroke="#3a5878" strokeWidth="1.5"/>
            <circle cx="440" cy="118" r="13" fill="none" stroke="#3a5878" strokeWidth="1.5"/>
            <circle cx="472" cy="118" r="13" fill="none" stroke="#3a5878" strokeWidth="1.5"/>
            <text x="520" y="160" textAnchor="middle" fill="#3a6b9e" fontSize="13">Galley</text>

            {/* ── COMPANIONWAY ── */}
            <rect x="438" y="193" width="72" height="46" rx="4" fill="#070e18" stroke="#c4943a" strokeWidth="2"/>
            <text x="474" y="222" textAnchor="middle" fill="#8B6430" fontSize="10" fontWeight="600">COMP</text>

            {/* ── GUEST BERTH (stbd aft) ── */}
            <rect x="60" y="58" width="295" height="148" rx="5" fill="#132a40" stroke="#2d5278" strokeWidth="1.5"/>
            <text x="207" y="140" textAnchor="middle" fill="#3a6b9e" fontSize="13">Guest Berth</text>

            {/* ── PORT AFT CABIN ── */}
            <path
              d="M 62,218 L 375,218 L 375,364 C 215,368 62,325 62,252 Z"
              fill="#132a40" stroke="#2d5278" strokeWidth="1.5"
            />
            <text x="215" y="308" textAnchor="middle" fill="#3a6b9e" fontSize="13">Aft Cabin</text>

            {/* Mast step */}
            <circle cx="490" cy="210" r="8" fill="none" stroke="#c4943a" strokeWidth="2"/>
            <line x1="490" y1="202" x2="490" y2="218" stroke="#c4943a" strokeWidth="1.5"/>
            <line x1="482" y1="210" x2="498" y2="210" stroke="#c4943a" strokeWidth="1.5"/>

            {/* Orientation labels */}
            <text x="985" y="215" textAnchor="start" fill="#1e3d5e" fontSize="11">BOW</text>
            <text x="12"  y="215" textAnchor="start" fill="#1e3d5e" fontSize="11">STERN</text>
            <text x="500" y="22"  textAnchor="middle" fill="#1e3d5e" fontSize="11">STARBOARD</text>
            <text x="500" y="414" textAnchor="middle" fill="#1e3d5e" fontSize="11">PORT</text>
          </svg>

          {/* Clickable circles */}
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
                aria-label={`${locker.name}`}
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
