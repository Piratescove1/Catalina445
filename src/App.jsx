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
import { exportAllData } from './lib/vault'
import { saveLocalBackup, listLocalBackups, pruneLocalBackups, deleteLocalBackup } from './lib/localBackups'
import InventoryScreen from './screens/InventoryScreen'
import VoyageScreen from './screens/VoyageScreen'
import MaintenanceScreen from './screens/MaintenanceScreen'
import DitchBagScreen from './screens/DitchBagScreen'
import ProvisionsScreen from './screens/ProvisionsScreen'
import NavBar from './components/NavBar'
import HelpScreen from './components/HelpScreen'
import LinkDevice from './components/LinkDevice'
import LicenseScreen from './components/LicenseScreen'
import CloudLogin from './components/CloudLogin'
import ManageBoats from './components/ManageBoats'
import { useBoats } from './context/BoatsContext'
import { useLicense } from './hooks/useLicense'
import { useCompartments } from './context/CompartmentsContext'
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
  const [showHelp, setShowHelp]       = useState(false)
  const [linkMode, setLinkMode]       = useState(null) // 'share' | 'receive' | null
  const [showLicense, setShowLicense] = useState(false)
  const [showCloud, setShowCloud]     = useState(false)
  const [showBoats, setShowBoats]     = useState(false)
  const [snapshots, setSnapshots]     = useState([])
  const [showLocal, setShowLocal]     = useState(false)
  const [localBackups, setLocalBackups] = useState([])
  const [showNudge, setShowNudge]     = useState(false)
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
    // Provisioning is shared (not per boat), so a per-boat sync pull leaves it
    // undefined — only import it when actually provided (e.g. a JSON restore).
    if (provisions !== undefined) importProvisions(provisions, provCats)
    importLabels(remoteLabels)
    importPrefs(remotePrefs)
  }, [importData, importMaintenance, importDitchBag, importLockers, importProvisions, importLabels, importPrefs])

  const {
    account, persist, logout, bioAvailable, bioOn, enableBiometric, disableBiometric,
    encryptData, decryptData, cloudEmail, restoreAllData,
  } = useAuth()

  const { status, boatId, push, pendingSync, resolveSync, listSnapshots, restoreSnapshot } = useSync({
    inventory, voyages, maintenance, futureProjects,
    ditchSop: sop, ditchItems, lockerInventory,
    provItems, provCategories, labels, prefs, onRemoteData,
    encrypt: encryptData, decrypt: decryptData,
  })

  useEffect(() => {
    push(inventory, voyages, maintenance, futureProjects, sop, ditchItems, lockerInventory, provItems, provCategories, labels, prefs)
  }, [push, inventory, voyages, maintenance, futureProjects, sop, ditchItems, lockerInventory, provItems, provCategories, labels, prefs])

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

  const license = useLicense(boatId)
  const { compartments, areas, importCompartments, importAreas } = useCompartments()
  const { activeBoat } = useBoats()
  const handleCheckout = (plan) => {
    // Phase 4b wires this to Stripe Checkout for the selected plan.
    alert(`Online payment for the ${plan.label} plan will be enabled once Stripe is connected.`)
  }

  // ── Full backup / restore ──────────────────────────────────
  // A backup is a raw snapshot of every app key (all boats + shared data), so
  // nothing is missed. exportAllData() reads current localStorage at call time.
  const buildFullBackup = useCallback(() => ({
    _app: 'catalina445', _version: 2, exportedAt: new Date().toISOString(),
    keys: exportAllData(),
  }), [])

  const backupToFile = useCallback((backup) => {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = (backup?.exportedAt || new Date().toISOString()).slice(0, 10)
    a.download = `catalina445-backup-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [])

  const downloadBackup = useCallback(() => backupToFile(buildFullBackup()), [backupToFile, buildFullBackup])

  const restoreFromFile = useCallback(async (file) => {
    const text = await file.text().catch(() => null)
    if (text == null) { alert('Could not read that file.'); return }
    let d
    try { d = JSON.parse(text) } catch { alert('That file is not a valid Catalina 445 backup.'); return }
    if (d && d.keys) {
      // v2 full snapshot — restore everything, re-encrypt, reload.
      await restoreAllData(d.keys)
      return
    }
    // v1 legacy (single boat, field-based).
    try {
      onRemoteData(d.inventory, d.voyages, d.maintenance, d.futureProjects, d.ditchSop, d.ditchItems, d.lockerInventory, d.provItems, d.provCategories, d.labels, d.prefs)
      if (d.areas) importAreas(d.areas)
      if (d.compartments) importCompartments(d.compartments)
      alert('Backup restored. Your data has been replaced with the contents of the file.')
    } catch {
      alert('That file is not a valid Catalina 445 backup.')
    }
  }, [restoreAllData, onRemoteData, importCompartments, importAreas])

  // ── Automatic on-device daily backup + once-a-day save nudge ──
  useEffect(() => {
    let cancelled = false
    const today = new Date().toISOString().slice(0, 10)
    ;(async () => {
      try {
        const all = await listLocalBackups()
        if (cancelled) return
        if (!all.some(b => b.id === today)) {
          await saveLocalBackup({ id: today, createdAt: Date.now(), backup: buildFullBackup() })
          await pruneLocalBackups(14)
        }
      } catch { /* IndexedDB unavailable (e.g. private mode) — skip silently */ }
    })()
    // Nudge to save a real file at most once a day.
    try {
      if (localStorage.getItem('c445-backup-nudge') !== today) setShowNudge(true)
    } catch { /* ignore */ }
    return () => { cancelled = true }
    // Runs once per app open / boat remount; the date guard keeps it to once a day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismissNudge = useCallback(() => {
    try { localStorage.setItem('c445-backup-nudge', new Date().toISOString().slice(0, 10)) } catch { /* ignore */ }
    setShowNudge(false)
  }, [])

  // ── Local backups list (Settings) ──────────────────────────
  const openLocal = useCallback(async () => {
    setShowLocal(true)
    try { setLocalBackups(await listLocalBackups()) } catch { setLocalBackups([]) }
  }, [])

  const restoreLocal = useCallback(async (rec) => {
    if (rec?.backup?.keys) await restoreAllData(rec.backup.keys)
  }, [restoreAllData])

  const deleteLocal = useCallback(async (id) => {
    try { await deleteLocalBackup(id); setLocalBackups(await listLocalBackups()) } catch { /* ignore */ }
  }, [])

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

      {/* License banner */}
      {(license.status === 'expired'
        || (license.status === 'trial' && license.daysLeft <= 7)
        || (license.status === 'active' && license.daysLeft <= 14)) && (
        <div className={`lic-banner lic-banner--${license.status}`} onClick={() => setShowLicense(true)}>
          {license.status === 'expired'
            ? 'Subscription expired — tap to renew (cloud sync & backups paused)'
            : license.status === 'trial'
              ? `Free trial: ${license.daysLeft} day${license.daysLeft === 1 ? '' : 's'} left — tap to subscribe`
              : `Subscription ends in ${license.daysLeft} days — tap to renew`}
        </div>
      )}

      {/* Daily "save a backup file" nudge */}
      {showNudge && (
        <div className="backup-nudge">
          <span className="backup-nudge-text">Save today’s backup to your device?</span>
          <div className="backup-nudge-btns">
            <button className="backup-nudge-btn backup-nudge-btn--go" onClick={() => { downloadBackup(); dismissNudge() }}>Save file</button>
            <button className="backup-nudge-btn" onClick={dismissNudge}>Not now</button>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showPrefs && (
        <div className="sync-panel sync-panel--scrollable">
          <p className="sync-panel-title">Settings</p>

          <div className="settings-section">
            <p className="settings-section-title">Boat</p>
            <div className="settings-row">
              <span className="settings-label">Current boat<small>{activeBoat?.name || '—'}</small></span>
              <button className="settings-btn" onClick={() => { setShowPrefs(false); setShowBoats(true) }}>Switch / manage</button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Boat name</span>
              <input className="settings-input" value={prefs.boatName}
                onChange={e => setPref('boatName', e.target.value)} placeholder="e.g. Catalina 445" />
            </div>
          </div>

          {account && (
            <div className="settings-section">
              <p className="settings-section-title">Account &amp; security</p>
              <div className="settings-row">
                <span className="settings-label">Signed in<small>{account.displayName || account.username}</small></span>
                <button className="settings-btn settings-btn--danger" onClick={logout}>Log out</button>
              </div>
              <div className="settings-row">
                <span className="settings-label">Cloud login<small>{cloudEmail || 'off'}</small></span>
                <button className="settings-btn" onClick={() => { setShowPrefs(false); setShowCloud(true) }}>
                  {cloudEmail ? 'Manage' : 'Enable'}
                </button>
              </div>
              {bioAvailable && (
                <div className="settings-row">
                  <span className="settings-label">Face ID / fingerprint</span>
                  {bioOn
                    ? <button className="settings-btn settings-btn--danger" onClick={disableBiometric}>Turn off</button>
                    : <button className="settings-btn" onClick={handleEnableBiometric}>Turn on</button>}
                </div>
              )}
            </div>
          )}

          <div className="settings-section">
            <p className="settings-section-title">Subscription</p>
            <div className="settings-row">
              <span className="settings-label">Status<small>{license.status === 'active'
                ? `active — ${license.daysLeft}d left`
                : license.status === 'trial'
                  ? `trial — ${license.daysLeft}d left`
                  : 'expired'}</small></span>
              <button className="settings-btn" onClick={() => { setShowPrefs(false); setShowLicense(true) }}>Manage</button>
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-section-title">Provisions</p>
            <ProvCategoryManager
              categories={provCategories}
              onAdd={addProvCat}
              onDelete={deleteProvCat}
              onRename={renameProvCat}
              onMove={moveProvCat}
            />
          </div>

          {account && (
            <div className="settings-section">
              <p className="settings-section-title">Share &amp; devices</p>
              <div className="settings-row">
                <span className="settings-label">Share this boat with another device</span>
                <button className="settings-btn" onClick={() => { setShowPrefs(false); setLinkMode('share') }}>Link…</button>
              </div>
              <div className="settings-row">
                <span className="settings-label">Link this device to a boat</span>
                <button className="settings-btn" onClick={() => { setShowPrefs(false); setLinkMode('receive') }}>Receive…</button>
              </div>
            </div>
          )}

          <div className="settings-section">
            <p className="settings-section-title">Backup &amp; data</p>
            <div className="settings-row">
              <span className="settings-label">Full backup (JSON)</span>
              <button className="settings-btn" onClick={downloadBackup}>Download</button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Excel backup</span>
              <button className="settings-btn"
                onClick={() => exportToExcel({ inventory, lockerInventory, voyages, maintenance, futureProjects, sop, ditchItems, provItems, boatName: prefs.boatName, compartments })}>
                Download
              </button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Restore from a backup file</span>
              <button className="settings-btn" onClick={() => fileInputRef.current?.click()}>Restore…</button>
            </div>
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
            <div className="settings-row">
              <span className="settings-label">On-device backups<small>automatic, once a day</small></span>
              <button className="settings-btn" onClick={openLocal}>Open</button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Cloud backups</span>
              <button className="settings-btn" onClick={openHistory} disabled={!license.premiumActive}>
                {license.premiumActive ? 'Open' : 'Renew to use'}
              </button>
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-section-title">Help</p>
            <div className="settings-row">
              <span className="settings-label">Help &amp; guide</span>
              <button className="settings-btn" onClick={() => { setShowPrefs(false); setShowHelp(true) }}>Open</button>
            </div>
          </div>

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
          boatName={activeBoat?.name || prefs.boatName}
          showLockers={activeBoat?.lockers !== false}
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

      {showHelp && <HelpScreen onClose={() => setShowHelp(false)} />}

      {linkMode && <LinkDevice mode={linkMode} onClose={() => setLinkMode(null)} />}

      {showLicense && <LicenseScreen license={license} onClose={() => setShowLicense(false)} onCheckout={handleCheckout} />}

      {showCloud && <CloudLogin onClose={() => setShowCloud(false)} />}

      {showBoats && <ManageBoats onClose={() => setShowBoats(false)} />}

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

      {/* On-device backups dialog */}
      {showLocal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <p className="dialog-title">On-device Backups</p>
            <p className="dialog-body dialog-body--dim">
              Saved automatically once a day on this device (last 14 kept). Works offline.
              Restoring replaces current data on all synced devices, then reloads.
            </p>
            <div className="history-list">
              {localBackups.length === 0 ? (
                <p className="dialog-body">No on-device backups yet. One is saved automatically each day you open the app.</p>
              ) : (
                localBackups.map(b => (
                  <div key={b.id} className="history-row">
                    <span className="history-when">{new Date(b.createdAt).toLocaleString()}</span>
                    <button className="dialog-btn" onClick={() => backupToFile(b.backup)}>Save file</button>
                    <button
                      className="dialog-btn dialog-btn--danger"
                      onClick={() => { if (window.confirm('Restore this backup? This replaces current data on all synced devices, then reloads.')) restoreLocal(b) }}
                    >
                      Restore
                    </button>
                    <button className="dialog-btn" onClick={() => { if (window.confirm('Delete this on-device backup?')) deleteLocal(b.id) }}>✕</button>
                  </div>
                ))
              )}
            </div>
            <button className="dialog-btn" onClick={() => setShowLocal(false)}>Close</button>
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
