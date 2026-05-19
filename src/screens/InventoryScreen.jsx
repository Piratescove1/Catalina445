import { useState, useCallback } from 'react'
import { COMPARTMENTS } from '../data/compartments'
import BoatDiagram from '../components/BoatDiagram'
import CompartmentModal from '../components/CompartmentModal'
import LockerDiagram from '../components/LockerDiagram'
import LockerModal from '../components/LockerModal'
import VoiceButton from '../components/VoiceButton'

export default function InventoryScreen({
  boatName,
  inventory, addItem, removeItem, setItemQty, deleteItem, renameItem, findItem,
  lockerInventory, addLockerItem, removeLockerItem, setLockerItemQty, deleteLockerItem, renameLockerItem,
  getLabel, setLabel,
}) {
  const [tab, setTab]         = useState('compartments')  // 'compartments' | 'lockers'
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState('')

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
        const comp = COMPARTMENTS.find(c => c.id === compartmentId)
        flash(`✓ Removed ${cmd.qty} × ${item.name} from ${comp?.name}`)
        break
      }
      case 'add': {
        if (cmd.compartmentNum) {
          const comp = COMPARTMENTS.find(c => c.num === cmd.compartmentNum)
          if (!comp) { flash(`Compartment ${cmd.compartmentNum} not found`); return }
          addItem(comp.id, cmd.item, cmd.qty)
          flash(`✓ Added ${cmd.qty} × ${cmd.item} to ${comp.name}`)
        } else if (selected && tab === 'compartments') {
          addItem(selected, cmd.item, cmd.qty)
          const comp = COMPARTMENTS.find(c => c.id === selected)
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
          const comp = COMPARTMENTS.find(c => c.id === r.compartmentId)
          return `#${comp?.num}(${r.item.qty})`
        }).join(', ')
        flash(`${total} × ${results[0].item.name} — compartments ${locs}`)
        break
      }
      default:
        flash(`Not handled here: "${raw}"`)
    }
  }, [selected, tab, findItem, addItem, removeItem])

  const handleTabChange = (t) => { setTab(t); setSelected(null) }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">{boatName || 'Catalina 445'}</h1>
          <p className="screen-subtitle">
            {tab === 'compartments'
              ? `${totalItems} items · ${compartmentsWithItems} compartments stocked`
              : `${totalLockerItems} items · ${lockersWithItems} lockers stocked`
            }
          </p>
        </div>
        {tab === 'compartments' && (
          <VoiceButton
            onCommand={handleGlobalVoice}
            context='Try: "remove 6 beans" · "add 3 flares to compartment 5" · "check flares"'
          />
        )}
      </header>

      {feedback && <div className="global-feedback">{feedback}</div>}

      {/* Sub-tabs */}
      <div className="inv-tabs">
        <button
          className={`inv-tab ${tab === 'compartments' ? 'inv-tab--active' : ''}`}
          onClick={() => handleTabChange('compartments')}
        >
          Compartments
        </button>
        <button
          className={`inv-tab ${tab === 'lockers' ? 'inv-tab--active' : ''}`}
          onClick={() => handleTabChange('lockers')}
        >
          Lockers &amp; Drawers
        </button>
      </div>

      <div className="screen-body">
        {tab === 'compartments' && (
          <BoatDiagram
            inventory={inventory}
            onSelect={setSelected}
            selected={selected}
            getLabel={getLabel}
          />
        )}
        {tab === 'lockers' && (
          <LockerDiagram
            lockerInventory={lockerInventory}
            onSelect={setSelected}
            selected={selected}
            getLabel={getLabel}
          />
        )}
      </div>

      {tab === 'compartments' && selected && (
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

      {tab === 'lockers' && selected && (
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
