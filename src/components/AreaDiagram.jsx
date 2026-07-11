function itemCount(inventory, id) {
  return (inventory[id] || []).reduce((s, i) => s + i.qty, 0)
}

// Renders one area's drawing (uploaded image or the built-in Catalina plan) with
// numbered markers, plus a list. In placeMode, tapping the drawing sets the
// position of the currently selected (placingId) compartment.
export default function AreaDiagram({
  area, compartments, inventory, onSelect, selected, getLabel,
  placeMode = false, placingId = null, onPlace,
}) {
  const src = area.image || area.builtinImage || null
  const comps = compartments.filter(c => c.areaId === area.id)

  const handleImageClick = (e) => {
    if (!placeMode || !placingId || !onPlace) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
    const py = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10
    onPlace(placingId, Math.max(0, Math.min(100, px)), Math.max(0, Math.min(100, py)))
  }

  return (
    <div className="diagram-wrap">
      {placeMode && (
        <p className="place-hint">Tap a compartment in the list to select it, then tap its spot on the drawing.</p>
      )}

      {src ? (
        <div className="diagram-scroll-outer">
          <div
            className="diagram-inner"
            onClick={handleImageClick}
            style={{ position: 'relative', width: '100%', cursor: placeMode ? 'crosshair' : 'default' }}
          >
            <img src={src} alt={area.name} className="area-diagram-img" draggable={false} />
            {comps.map(c => {
              if (c.px == null || c.py == null) return null
              const isSel = selected === c.id
              const count = itemCount(inventory, c.id)
              const has = count > 0
              return (
                <button
                  key={c.id}
                  className={`circle-btn ${isSel ? 'circle-btn--active' : ''} ${has ? 'circle-btn--stocked' : ''}`}
                  style={{ left: `${c.px}%`, top: `${c.py}%` }}
                  onClick={(e) => { e.stopPropagation(); if (!placeMode) onSelect(c.id) }}
                  aria-label={`Compartment ${c.num}`}
                >
                  <span className="circle-num">{c.num}</span>
                  {has && <span className="circle-badge">{count > 99 ? '99+' : count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="area-empty">
          No drawing for “{area.name}” yet. Add one with <strong>Manage compartments → Upload drawing</strong>,
          or just use the list below.
        </div>
      )}

      <div className="comp-list">
        {comps.length === 0 && <p className="item-empty">No compartments in this area yet.</p>}
        {comps.map(c => {
          const count = itemCount(inventory, c.id)
          const isSel = (placeMode ? placingId : selected) === c.id
          const placedNote = placeMode ? (c.px == null ? ' — tap to place' : ' ✓ placed') : ''
          return (
            <button
              key={c.id}
              className={`comp-row ${isSel ? 'comp-row--active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <span className="comp-num">{c.num}</span>
              <span className="comp-icon">{c.icon}</span>
              <span className="comp-name">{getLabel ? getLabel(c.id, c.name) : c.name}{placedNote}</span>
              {!placeMode && (count > 0
                ? <span className="comp-count">{count} items</span>
                : <span className="comp-empty">empty</span>)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
