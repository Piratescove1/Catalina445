import { useState, useEffect, useCallback } from 'react'
import { useInventory } from './hooks/useInventory'
import { useSync, joinBoat } from './hooks/useSync'
import InventoryScreen from './screens/InventoryScreen'
import VoyageScreen from './screens/VoyageScreen'
import NavBar from './components/NavBar'
import './index.css'

const STATUS_LABEL = {
  connecting:    '⟳ Connecting…',
  syncing:       '⟳ Syncing…',
  synced:        '✓ Synced',
  offline:       '⚡ Offline — Update via one device only',
  unconfigured:  '',
}

export default function App() {
  const [screen, setScreen] = useState('inventory')
  const [showSync, setShowSync] = useState(false)
  const [joinInput, setJoinInput] = useState('')

  const {
    inventory, voyages, activeVoyage,
    addItem, removeItem, setItemQty, deleteItem, findItem,
    startVoyage, endVoyage, resumeVoyage, renameVoyage,
    addVoyageNote, addLogEntry, updateLogEntry,
    importData,
  } = useInventory()

  const onRemoteData = useCallback((inv, voy) => {
    importData(inv, voy)
  }, [importData])

  const { status, boatId, push } = useSync({ inventory, voyages, onRemoteData })

  // Push to Firestore whenever local data changes
  useEffect(() => {
    push(inventory, voyages)
  }, [inventory, voyages])

  return (
    <div className="app">
      {/* Sync status bar */}
      {status !== 'unconfigured' && (
        <div className="sync-bar" onClick={() => setShowSync(s => !s)}>
          <span className={`sync-status sync-status--${status}`}>{STATUS_LABEL[status]}</span>
          <span className="sync-boat-id">Boat: {boatId}</span>
        </div>
      )}

      {/* Sync panel */}
      {showSync && (
        <div className="sync-panel">
          <p className="sync-panel-title">Device Sync</p>
          <p className="sync-panel-label">Your Boat Code</p>
          <p className="sync-panel-code">{boatId}</p>
          <p className="sync-panel-hint">Enter this code on another device to share all data.</p>
          <div className="sync-join-row">
            <input
              className="add-input add-input--name"
              placeholder="Enter a boat code to join…"
              value={joinInput}
              onChange={e => setJoinInput(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button
              className="add-btn"
              disabled={joinInput.length < 4}
              onClick={() => joinBoat(joinInput)}
            >
              Join
            </button>
          </div>
          <button className="sync-close" onClick={() => setShowSync(false)}>Close</button>
        </div>
      )}

      {screen === 'inventory' && (
        <InventoryScreen
          inventory={inventory}
          addItem={addItem}
          removeItem={removeItem}
          setItemQty={setItemQty}
          deleteItem={deleteItem}
          findItem={findItem}
        />
      )}
      {screen === 'voyage' && (
        <VoyageScreen
          voyages={voyages}
          activeVoyage={activeVoyage}
          startVoyage={startVoyage}
          endVoyage={endVoyage}
          resumeVoyage={resumeVoyage}
          renameVoyage={renameVoyage}
          addVoyageNote={addVoyageNote}
          addLogEntry={addLogEntry}
          updateLogEntry={updateLogEntry}
        />
      )}
      <NavBar active={screen} onNavigate={setScreen} />
    </div>
  )
}
