import { useState, useCallback } from 'react'
import { useCompartments } from '../context/CompartmentsContext'
import AreaDiagram from '../components/AreaDiagram'
import CompartmentModal from '../components/CompartmentModal'
import ManageCompartments from '../components/ManageCompartments'
import LockerDiagram from '../components/LockerDiagram'
import LockerModal from '../components/LockerModal'
import VoiceButton from '../components/VoiceButton'

export default function InventoryScreen({
  boatName,
  inventory, addItem, removeItem, setItemQty, deleteItem, renameItem, findItem,
  lockerInventory, addLockerItem, setLockerItemQty, deleteLockerItem, renameLockerItem,
  getLabel, setLabel,
}) {
  const { compartments, areas, setCompartmentPosition } = useCompartments()
  const [tab, setTab] = useState(() => areas[0]?.id || 'lockers')
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [manageOpen, setManageOpen] = useState(false)
  const [placeMode, setPlaceMode] = useState(false)
  const [placingId, setPlacingId] = useState(null)

  const isLockers = tab === 'lockers'
  const activeArea = isLockers ? null : (areas.find(a => a.id === tab) || areas[0])

  const flash = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(''), 4000) }

  const totalItems = Object.values(inventory).reduce((sum, items) => sum + items.reduce((s, i) => s + i.qty, 0), 0)
  const compartmentsWithItems = Object.values(inventory).filter(items => items.length > 0).length
  const totalLockerItems = Object.values(lockerInventory).reduce((sum, items) => sum + items.reduce((s, i) => s + i.qty, 0), 0)
  const lockersWithItems = Object.values(lockerInventory).filter(items => items.length > 0).length

  const handleGlobalVoice = useCallback((cmd, raw) => {
    if (!cmd) { flash(`Didn't understand: "${raw}"`); return }
    switch (cmd.action) {
      case 'remove': {
        const results = findItem(cmd.item)
        if (!results.length) { flash(`"${cmd.item}" not found in any compartment`); return }
        const { compartmentId, item } = results[0]
        removeItem(compartmentId, item.name, cmd.qty)
        const comp = compartments.find(c => c.id === compartmentId)
        flash(`✓ Removed ${cmd.qty} × ${item.name} from ${comp?.name}`)
        break
      }
      case 'add': {
        if (cmd.compartmentNum) {
          const comp = compartments.find(c => c.num === cmd.compartmentNum)
          if (!comp) { flash(`Compartment ${cmd.compartmentNum} not found`); return }
          addItem(comp.id, cmd.item, cmd.qty)
          flash(`✓ Added ${cmd.qty} × ${cmd.item} to ${comp.name}`)
        } else if (selected && !isLockers) {
          addItem(selected, cmd.item, cmd.qty)
          const comp = compartments.find(c => c.id === selected)
          flash(`✓ Added ${cmd.qty} × ${cmd.item} to ${comp?.name}`)
        } else {
          flash(`Say which compartment — e.g. "add 3 flares to compartment 5"`)
        }
        break
      }
      case 'check': {
        const results = findItem(cmd.item)
        if (!results.length) { flash(`"${cmd.item}" not found anywhere`); return }
        const total = results.reduce((s, r) => s + r.item.qty, 0)
        const locs = results.map(r => {
          const comp = compartments.find(c => c.id === r.compartmentId)
          return `#${comp?.num}(${r.item.qty})`
        }).join(', ')
        flash(`${total} × ${results[0].item.name} — compartments ${locs}`)
        break
      }
      default:
        flash(`Not handled here: "${raw}"`)
    }
  }, [selected, isLockers, findItem, addItem, removeItem, compartments])

  const handleTabChange = (t) => {
    setTab(t); setSelected(null); setPlaceMode(false); setPlacingId(null)
  }
  const handleSelect = (id) => {
    if (placeMode) setPlacingId(id)
    else setSelected(id)
  }
  const canPlace = activeArea && (activeArea.image || activeArea.builtinImage)

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">{boatName || 'Catalina 445'}</h1>
          <p className="screen-subtitle">
            {isLockers
              ? `${totalLockerItems} items · ${lockersWithItems} lockers stocked`
              : `${totalItems} items · ${compartmentsWithItems} compartments stocked`}
          </p>
        </div>
        {!isLockers && (
          <VoiceButton
            onCommand={handleGlobalVoice}
            context='Try: "remove 6 beans" · "add 3 flares to compartment 5" · "check flares"'
          />
        )}
      </header>

      {feedback && <div className="global-feedback">{feedback}</div>}

      {/* Tabs: one per area, plus lockers */}
      <div className="inv-tabs">
        {areas.map(a => (
          <button
            key={a.id}
            className={`inv-tab ${tab === a.id ? 'inv-tab--active' : ''}`}
            onClick={() => handleTabChange(a.id)}
          >
            {a.name}
          </button>
        ))}
        <button
          className={`inv-tab ${isLockers ? 'inv-tab--active' : ''}`}
          onClick={() => handleTabChange('lockers')}
        >
          Lockers &amp; Drawers
        </button>
      </div>

      {!isLockers && (
        <div className="inv-manage-row">
          {canPlace && (
            <button
              className={`export-btn ${placeMode ? 'export-btn--on' : ''}`}
              onClick={() => { setPlaceMode(p => !p); setPlacingId(null); setSelected(null) }}
            >
              {placeMode ? 'Done placing' : 'Place markers'}
            </button>
          )}
          <button className="export-btn" onClick={() => setManageOpen(true)}>Manage compartments</button>
        </div>
      )}

      <div className="screen-body">
        {!isLockers && activeArea && (
          <AreaDiagram
            area={activeArea}
            compartments={compartments}
            inventory={inventory}
            onSelect={handleSelect}
            selected={selected}
            getLabel={getLabel}
            placeMode={placeMode}
            placingId={placingId}
            onPlace={setCompartmentPosition}
          />
        )}
        {isLockers && (
          <LockerDiagram
            lockerInventory={lockerInventory}
            onSelect={setSelected}
            selected={selected}
            getLabel={getLabel}
          />
        )}
      </div>

      {manageOpen && <ManageCompartments inventory={inventory} onClose={() => setManageOpen(false)} />}

      {!isLockers && selected && !placeMode && (
        <CompartmentModal
          compartmentId={selected}
          inventory={inventory}
          onClose={() => setSelected(null)}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onSetQty={setItemQty}
          onDeleteItem={deleteItem}
          onRenameItem={renameItem}
          onFindItem={findItem}
          label={getLabel(selected, null)}
          onSetLabel={setLabel}
        />
      )}

      {isLockers && selected && (
        <LockerModal
          lockerId={selected}
          lockerInventory={lockerInventory}
          onClose={() => setSelected(null)}
          onAddItem={addLockerItem}
          onSetQty={setLockerItemQty}
          onDeleteItem={deleteLockerItem}
          onRenameItem={renameLockerItem}
          label={getLabel(selected, null)}
          onSetLabel={setLabel}
        />
      )}
    </div>
  )
}
