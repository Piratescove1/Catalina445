import { useState, useCallback } from 'react'
import { COMPARTMENTS } from '../data/compartments'
import BoatDiagram from '../components/BoatDiagram'
import CompartmentModal from '../components/CompartmentModal'
import VoiceButton from '../components/VoiceButton'

export default function InventoryScreen({ boatName, inventory, addItem, removeItem, setItemQty, deleteItem, findItem }) {
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState('')

  const flash = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 4000)
  }

  const totalItems = Object.values(inventory).reduce((sum, items) => sum + items.reduce((s, i) => s + i.qty, 0), 0)
  const compartmentsWithItems = Object.values(inventory).filter(items => items.length > 0).length

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
        } else if (selected) {
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
  }, [selected, findItem, addItem, removeItem])

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">{boatName || 'Catalina 445'}</h1>
          <p className="screen-subtitle">{totalItems} items · {compartmentsWithItems} compartments stocked</p>
        </div>
        <VoiceButton
          onCommand={handleGlobalVoice}
          context='Try: "remove 6 beans" · "add 3 flares to compartment 5" · "check flares"'
        />
      </header>
      {feedback && <div className="global-feedback">{feedback}</div>}

      <div className="screen-body">
        <BoatDiagram
          inventory={inventory}
          onSelect={setSelected}
          selected={selected}
        />
      </div>

      {selected && (
        <CompartmentModal
          compartmentId={selected}
          inventory={inventory}
          onClose={() => setSelected(null)}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onSetQty={setItemQty}
          onDeleteItem={deleteItem}
          onFindItem={findItem}
        />
      )}
    </div>
  )
}
