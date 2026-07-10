import { useState, useEffect, useCallback, useRef } from 'react'
import { exportToExcel } from './lib/exportExcel'
import { useInventory } from './hooks/useInventory'
import { useMaintenance } from './hooks/useMaintenance'
import { useDitchBag } from './hooks/useDitchBag'
import { useLockers } from './hooks/useLockers'
import { useProvisions } from './hooks/useProvisions'
import { usePrefs } from './hooks/usePrefs'
import { useLabels } from './hooks/useLabels'
import { useSync, joinBoat } from './hooks/useSync'
import { useAuth } from './context/AuthContext'
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

// ── Provision category manager ─────────────────────────────
function ProvCategoryManager({ categories, onAdd, onDelete, onRename, onMove }) {
  const [newCat,   setNewCat]   = useState('')
  const [renaming, setRenaming] = useState(null)  // { index, draft }

  const handleAdd = () => {
    if (!newCat.trim()) return
    onAdd(newCat.trim())
    setNewCat('')
  }

  const commitRename = (index) => {
    if (renaming?.draft.trim()) onRename(categories[index], renaming.draft.trim())
    setRenaming(null)
  }

  return (
    <div className="prov-cat-manager">
      <p className="prefs-label">Provision Categories</p>
      <p className="prov-cat-hint">Drag order with ↑↓ buttons. Items in a deleted category move to the first remaining one.</p>

      <div className="prov-cat-list">
        {categories.map((cat, i) => (
          <div key={cat} className="prov-cat-row">
            <div className="prov-cat-arrows">
              <button
                className="prov-cat-arrow"
                onClick={() => onMove(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
              >▲</button>
              <button
                className="prov-cat-arrow"
                onClick={() => onMove(i, 1)}
                disabled={i === categories.length - 1}
                aria-label="Move down"
              >▼</button>
            </div>

            {renaming?.index === i ? (
              <>
                <input
                  className="add-input prov-cat-rename-input"
                  value={renaming.draft}
                  onChange={e => setRenaming(r => ({ ...r, draft: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  commitRename(i)
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                  autoFocus
                />
                <button className="prov-cat-action prov-cat-action--save" onClick={() => commitRename(i)}>Save</button>
                <button className="prov-cat-action" onClick={() => setRenaming(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span className="prov-cat-name">{cat}</span>
                <button className="prov-cat-action" onClick={() => setRenaming({ index: i, draft: cat })}>Rename</button>
                <button
                  className="prov-cat-action prov-cat-action--del"
                  onClick={() => onDelete(cat)}
                  disabled={categories.length <= 1}
                  aria-label={`Delete ${cat}`}
                >✕</button>
              </>
            )}
          </div>
        ))}
      </div>

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
  const [screen, setScreen]           = useState('inventory')
  const [showSync, setShowSync]       = useState(false)
  const [showPrefs, setShowPrefs]     = useState(false)
  const [joinInput, setJoinInput]     = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [snapshots, setSnapshots]     = useState([])
  const fileInputRef                  = useRef(null)

  const { prefs, setPref, importPrefs } = usePrefs()

  const { labels, setLabel, getLabel, importLabels } = useLabels()

  const {
    lockerInventory, addLockerItem, removeLockerItem,
    setLockerItemQty, deleteLockerItem, renameLockerItem, importLockers,
  } = useLockers()

  const {
    inventory, voyages, activeVoyage,
    addItem, removeItem, setItemQty, deleteItem, renameItem, findItem,
    startVoyage, endVoyage, resumeVoyage, renameVoyage,
    addVoyageNote, addLogEntry, updateLogEntry, deleteLogEntry, deleteVoyage,
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
    items: provItems, toggleItem: toggleProvItem, toggleGot: toggleProvGot, addItem: addProvItem,
    deleteItem: deleteProvItem, renameItem: renameProvItem, moveItem: moveProvItem,
    clearList: clearProvList, resetDefaults: resetProvDefaults,
    categories: provCategories,
    addCategory: addProvCat, deleteCategory: deleteProvCat,
    renameCategory: renameProvCat, moveCategory: moveProvCat,
    importProvisions,
  } = useProvisions()

  const onRemoteData = useCallback((inv, voy, maint, future, ditchSop, ditchItemsRemote, lockers, provisions, provCats, remoteLabels, remotePrefs) => {
    importData(inv, voy)
    importMaintenance(maint, future)
    importDitchBag(ditchSop, ditchItemsRemote)
    importLockers(lockers)
    importProvisions(provisions, provCats)
    importLabels(remoteLabels)
    importPrefs(remotePrefs)
  }, [importData, importMaintenance, importDitchBag, importLockers, importProvisions, importLabels, importPrefs])

  const { status, boatId, push, pendingSync, resolveSync, listSnapshots, restoreSnapshot } = useSync({
    inventory, voyages, maintenance, futureProjects,
    ditchSop: sop, ditchItems, lockerInventory,
    provItems, provCategories, labels, prefs, onRemoteData,
  })

  useEffect(() => {
    push(inventory, voyages, maintenance, futureProjects, sop, ditchItems, lockerInventory, provItems, provCategories, labels, prefs)
  }, [push, inventory, voyages, maintenance, futureProjects, sop, ditchItems, lockerInventory, provItems, provCategories, labels, prefs])

  // Keep the encrypted local vault current on every change.
  const { account, persist, logout, bioAvailable, bioOn, enableBiometric, disableBiometric } = useAuth()

  const handleEnableBiometric = async () => {
    try {
      await enableBiometric()
      alert('Face ID unlock enabled. Next time you open the app, tap “Unlock with Face ID”.')
    } catch (e) {
      alert(e?.message === 'prf-unsupported'
        ? 'This device or browser can’t do secure Face ID unlock. Your password still works.'
        : 'Could not enable Face ID unlock. Your password still works.')
    }
  }
  useEffect(() => {
    persist()
  }, [persist, inventory, voyages, maintenance, futureProjects, sop, ditchItems, lockerInventory, provItems, provCategories, labels, prefs])

  // ── Full JSON backup / restore ─────────────────────────────
  const downloadBackup = useCallback(() => {
    const data = {
      _app: 'catalina445', _version: 1, exportedAt: new Date().toISOString(), boatId,
      inventory, voyages, maintenance, futureProjects, ditchSop: sop, ditchItems,
      lockerInventory, provItems, provCategories, labels, prefs,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `catalina445-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [boatId, inventory, voyages, maintenance, futureProjects, sop, ditchItems, lockerInventory, provItems, provCategories, labels, prefs])

  const restoreFromFile = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result)
        onRemoteData(d.inventory, d.voyages, d.maintenance, d.futureProjects, d.ditchSop, d.ditchItems, d.lockerInventory, d.provItems, d.provCategories, d.labels, d.prefs)
        alert('Backup restored. Your data has been replaced with the contents of the file.')
      } catch {
        alert('That file is not a valid Catalina 445 backup.')
      }
    }
    reader.readAsText(file)
  }, [onRemoteData])

  // ── Cloud history (automatic snapshots) ────────────────────
  const openHistory = useCallback(async () => {
    setShowHistory(true)
    setSnapshots(await listSnapshots())
  }, [listSnapshots])

  const doRestoreSnapshot = useCallback(async (id) => {
    const ok = await restoreSnapshot(id)
    setShowHistory(false)
    alert(ok ? 'Restored from cloud backup.' : 'Could not restore that backup.')
  }, [restoreSnapshot])

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
          {account && (
            <div className="account-row">
              <span className="account-who">Signed in as <strong>{account.displayName || account.username}</strong></span>
              <button className="sync-close" onClick={logout}>Log out</button>
            </div>
          )}
          {account && bioAvailable && (
            <div className="account-row">
              <span className="account-who">Face ID / fingerprint unlock</span>
              {bioOn
                ? <button className="sync-close" onClick={disableBiometric}>Turn off</button>
                : <button className="export-btn" onClick={handleEnableBiometric}>Turn on</button>}
            </div>
          )}
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
            categories={provCategories}
            onAdd={addProvCat}
            onDelete={deleteProvCat}
            onRename={renameProvCat}
            onMove={moveProvCat}
          />

          <button
            className="export-btn"
            onClick={() => exportToExcel({ inventory, lockerInventory, voyages, maintenance, futureProjects, sop, ditchItems, provItems, boatName: prefs.boatName })}
          >
            Download Excel Backup
          </button>
          <button className="export-btn" onClick={downloadBackup}>
            Download Full Backup (JSON)
          </button>
          <button className="export-btn" onClick={() => fileInputRef.current?.click()}>
            Restore from Backup File…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f && window.confirm('Restore from this backup file? This replaces your current data on all synced devices.')) {
                restoreFromFile(f)
              }
              e.target.value = ''
            }}
          />
          <button className="export-btn" onClick={openHistory}>
            Cloud Backups…
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
          renameItem={renameItem}
          findItem={findItem}
          lockerInventory={lockerInventory}
          addLockerItem={addLockerItem}
          removeLockerItem={removeLockerItem}
          setLockerItemQty={setLockerItemQty}
          deleteLockerItem={deleteLockerItem}
          renameLockerItem={renameLockerItem}
          getLabel={getLabel}
          setLabel={setLabel}
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
          deleteVoyage={deleteVoyage}
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
          categories={provCategories}
          toggleItem={toggleProvItem}
          toggleGot={toggleProvGot}
          addItem={addProvItem}
          deleteItem={deleteProvItem}
          renameItem={renameProvItem}
          moveItem={moveProvItem}
          clearList={clearProvList}
          resetDefaults={resetProvDefaults}
          storeInCompartment={addItem}
          storeInLocker={addLockerItem}
          getLabel={getLabel}
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

      {/* Cloud backups (history) dialog */}
      {showHistory && (
        <div className="dialog-overlay">
          <div className="dialog">
            <p className="dialog-title">Cloud Backups</p>
            <p className="dialog-body dialog-body--dim">
              Automatic snapshots, newest first. Restoring replaces current data on all synced devices.
            </p>
            <div className="history-list">
              {snapshots.length === 0 ? (
                <p className="dialog-body">No cloud backups yet. They’re created automatically as you use the app.</p>
              ) : (
                snapshots.map(s => (
                  <div key={s.id} className="history-row">
                    <span className="history-when">{new Date(s.createdAt).toLocaleString()}</span>
                    <button
                      className="dialog-btn dialog-btn--danger"
                      onClick={() => { if (window.confirm('Restore this backup? This replaces current data on all synced devices.')) doRestoreSnapshot(s.id) }}
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
            <button className="dialog-btn" onClick={() => setShowHistory(false)}>Close</button>
          </div>
        </div>
      )}

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
