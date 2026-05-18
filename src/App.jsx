import { useState, useEffect, useCallback } from 'react'
import { exportToExcel } from './lib/exportExcel'
import { useInventory } from './hooks/useInventory'
import { useMaintenance } from './hooks/useMaintenance'
import { useDitchBag } from './hooks/useDitchBag'
import { useLockers } from './hooks/useLockers'
import { useProvisions } from './hooks/useProvisions'
import { usePrefs } from './hooks/usePrefs'
import { useSync, joinBoat } from './hooks/useSync'
import InventoryScreen from './screens/InventoryScreen'
import VoyageScreen from './screens/VoyageScreen'
import MaintenanceScreen from './screens/MaintenanceScreen'
import DitchBagScreen from './screens/DitchBagScreen'
import ProvisionsScreen from './screens/ProvisionsScreen'
import NavBar from './components/NavBar'
import './index.css'

const STATUS_LABEL = {
  connecting:    '⟳ Connecting…',
  syncing:       '⟳ Syncing…',
  synced:        '✓ Synced',
  offline:       '⚡ Not Connected — Only edit on one device while offline. If two devices both make changes offline, the last one to reconnect will overwrite the other.',
  unconfigured:  '',
}

// ── Provision categories manager (used inside Settings panel) ──
function ProvCategoryManager({ customCategories, onAdd, onDelete, onRename }) {
  const [newCat,    setNewCat]    = useState('')
  const [renaming,  setRenaming]  = useState(null)   // { name, draft }

  const handleAdd = () => {
    if (!newCat.trim()) return
    onAdd(newCat.trim())
    setNewCat('')
  }

  const commitRename = () => {
    if (renaming && renaming.draft.trim()) onRename(renaming.name, renaming.draft.trim())
    setRenaming(null)
  }

  return (
    <div className="prov-cat-manager">
      <p className="prefs-label">Provision Categories</p>

      {customCategories.length === 0 && (
        <p className="prov-cat-empty">No custom categories yet.</p>
      )}

      {customCategories.map(cat => (
        <div key={cat} className="prov-cat-row">
          {renaming?.name === cat ? (
            <>
              <input
                className="add-input add-input--name prov-cat-rename-input"
                value={renaming.draft}
                onChange={e => setRenaming(r => ({ ...r, draft: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }}
                autoFocus
              />
              <button className="prov-cat-action prov-cat-action--save" onClick={commitRename}>Save</button>
              <button className="prov-cat-action" onClick={() => setRenaming(null)}>Cancel</button>
            </>
          ) : (
            <>
              <span className="prov-cat-name">{cat}</span>
              <button className="prov-cat-action" onClick={() => setRenaming({ name: cat, draft: cat })}>Rename</button>
              <button className="prov-cat-action prov-cat-action--del" onClick={() => onDelete(cat)}>✕</button>
            </>
          )}
        </div>
      ))}

      <div className="prov-cat-add-row">
        <input
          className="add-input add-input--name"
          placeholder="New category name…"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="add-btn" onClick={handleAdd} disabled={!newCat.trim()}>Add</button>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen]       = useState('inventory')
  const [showSync, setShowSync]   = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [joinInput, setJoinInput] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const { prefs, setPref } = usePrefs()

  const {
    lockerInventory, addLockerItem, removeLockerItem,
    setLockerItemQty, deleteLockerItem, importLockers,
  } = useLockers()

  const {
    inventory, voyages, activeVoyage,
    addItem, removeItem, setItemQty, deleteItem, findItem,
    startVoyage, endVoyage, resumeVoyage, renameVoyage,
    addVoyageNote, addLogEntry, updateLogEntry, deleteLogEntry,
    importData,
  } = useInventory()

  const {
    maintenance, addEntry, updateEntry, deleteEntry,
    futureProjects, addProject, updateProject, deleteProject,
    addPart, togglePart, deletePart,
    importMaintenance,
  } = useMaintenance()

  const {
    sop, setSop, items: ditchItems, addItem: addDitchItem,
    updateItem: updateDitchItem, deleteItem: deleteDitchItem,
    togglePacked, importDitchBag,
  } = useDitchBag()

  const {
    items: provItems, toggleItem: toggleProvItem, addItem: addProvItem,
    deleteItem: deleteProvItem, clearList: clearProvList, resetDefaults: resetProvDefaults,
    allCategories: provAllCategories, customCategories: provCustomCats,
    addCategory: addProvCat, deleteCategory: deleteProvCat, renameCategory: renameProvCat,
    importProvisions,
  } = useProvisions()

  const onRemoteData = useCallback((inv, voy, maint, future, ditchSop, ditchItemsRemote, lockers, provisions, provCats) => {
    importData(inv, voy)
    importMaintenance(maint, future)
    importDitchBag(ditchSop, ditchItemsRemote)
    importLockers(lockers)
    importProvisions(provisions, provCats)
  }, [importData, importMaintenance, importDitchBag, importLockers, importProvisions])

  const { status, boatId, push, pendingSync, resolveSync } = useSync({
    inventory, voyages, maintenance, futureProjects,
    ditchSop: sop, ditchItems, lockerInventory, provItems, provCategories: provCustomCats, onRemoteData,
  })

  // Push to Firestore whenever local data changes
  useEffect(() => {
    push(inventory, voyages, maintenance, futureProjects, sop, ditchItems, lockerInventory, provItems, provCustomCats)
  }, [inventory, voyages, maintenance, futureProjects, sop, ditchItems, lockerInventory, provItems, provCustomCats])

  return (
    <div className="app">
      {/* Sync status bar */}
      {status !== 'unconfigured' && (
        <div
          className={`sync-bar${status === 'offline' ? ' sync-bar--offline' : ''}`}
          onClick={() => { setShowSync(s => !s); setShowPrefs(false) }}
        >
          <span className={`sync-status sync-status--${status}`}>{STATUS_LABEL[status]}</span>
          <span className="sync-boat-id">Boat: {boatId}</span>
          <button
            className="prefs-gear-btn"
            onClick={e => { e.stopPropagation(); setShowPrefs(s => !s); setShowSync(false) }}
            aria-label="Settings"
          >⚙️</button>
        </div>
      )}

      {/* Settings panel */}
      {showPrefs && (
        <div className="sync-panel sync-panel--scrollable">
          <p className="sync-panel-title">Settings</p>
          <div className="prefs-row">
            <label className="prefs-label">Boat Name</label>
            <input
              className="add-input add-input--name"
              value={prefs.boatName}
              onChange={e => setPref('boatName', e.target.value)}
              placeholder="e.g. Catalina 445"
            />
          </div>

          <ProvCategoryManager
            customCategories={provCustomCats}
            onAdd={addProvCat}
            onDelete={deleteProvCat}
            onRename={renameProvCat}
          />

          <button
            className="export-btn"
            onClick={() => exportToExcel({ inventory, lockerInventory, voyages, maintenance, futureProjects, sop, ditchItems, provItems, boatName: prefs.boatName })}
          >
            Download Excel Backup
          </button>
          <button className="sync-close" onClick={() => setShowPrefs(false)}>Done</button>
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
          boatName={prefs.boatName}
          inventory={inventory}
          addItem={addItem}
          removeItem={removeItem}
          setItemQty={setItemQty}
          deleteItem={deleteItem}
          findItem={findItem}
          lockerInventory={lockerInventory}
          addLockerItem={addLockerItem}
          removeLockerItem={removeLockerItem}
          setLockerItemQty={setLockerItemQty}
          deleteLockerItem={deleteLockerItem}
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
          deleteLogEntry={deleteLogEntry}
        />
      )}
      {screen === 'maintenance' && (
        <MaintenanceScreen
          maintenance={maintenance}
          addEntry={addEntry}
          updateEntry={updateEntry}
          deleteEntry={deleteEntry}
          futureProjects={futureProjects}
          addProject={addProject}
          updateProject={updateProject}
          deleteProject={deleteProject}
          addPart={addPart}
          togglePart={togglePart}
          deletePart={deletePart}
        />
      )}
      {screen === 'provisions' && (
        <ProvisionsScreen
          items={provItems}
          allCategories={provAllCategories}
          toggleItem={toggleProvItem}
          addItem={addProvItem}
          deleteItem={deleteProvItem}
          clearList={clearProvList}
          resetDefaults={resetProvDefaults}
        />
      )}
      {screen === 'ditchbag' && (
        <DitchBagScreen
          sop={sop}
          setSop={setSop}
          items={ditchItems}
          addItem={addDitchItem}
          updateItem={updateDitchItem}
          deleteItem={deleteDitchItem}
          togglePacked={togglePacked}
        />
      )}
      <NavBar active={screen} onNavigate={setScreen} />

      {/* Reconnect dialog — step 1 */}
      {pendingSync && !showConfirm && (
        <div className="dialog-overlay">
          <div className="dialog">
            <p className="dialog-title">Reconnected with Unsynced Changes</p>
            <p className="dialog-body">
              You made changes while offline. Do you want to overwrite the shared database with your offline changes?
            </p>
            <p className="dialog-body dialog-body--dim">
              Selecting <strong>No</strong> will discard your offline changes and restore the shared database version.
            </p>
            <div className="dialog-btns">
              <button className="dialog-btn dialog-btn--danger" onClick={() => setShowConfirm(true)}>Yes, overwrite database</button>
              <button className="dialog-btn" onClick={() => resolveSync(false)}>No, restore database version</button>
            </div>
          </div>
        </div>
      )}

      {/* Reconnect dialog — step 2 (confirmation) */}
      {pendingSync && showConfirm && (
        <div className="dialog-overlay">
          <div className="dialog">
            <p className="dialog-title">Are you sure?</p>
            <p className="dialog-body">
              This will permanently overwrite the shared database with your offline changes. All other devices will receive your version on next sync.
            </p>
            <div className="dialog-btns">
              <button className="dialog-btn dialog-btn--danger" onClick={() => { setShowConfirm(false); resolveSync(true) }}>Yes, overwrite</button>
              <button className="dialog-btn" onClick={() => { setShowConfirm(false); resolveSync(false) }}>No, restore database version</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
