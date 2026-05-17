import { useState } from 'react'
import { exportMaintenancePDF } from '../utils/exportMaintenancePDF'

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  projectName: '',
  replacementParts: '',
  workDoneBy: '',
  approxCost: '',
  notes: '',
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString([], {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function ConfirmDialog({ title, body, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <p className="dialog-title">{title}</p>
        <p className="dialog-body">{body}</p>
        <div className="dialog-btns">
          <button className="dialog-btn dialog-btn--danger" onClick={onConfirm}>{confirmLabel}</button>
          <button className="dialog-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Maintenance log components ───────────────────────────

function EntryCard({ entry, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="maint-card">
      <div className="maint-card-header">
        <span className="maint-date">{formatDate(entry.date)}</span>
        <div className="maint-card-actions">
          <button className="maint-action-btn" onClick={onEdit}>Edit</button>
          <button className="maint-action-btn maint-action-btn--danger" onClick={() => setConfirmDelete(true)}>Delete</button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Maintenance Record?"
          body={`Delete "${entry.projectName}"? This cannot be undone.`}
          confirmLabel="Yes, delete record"
          onConfirm={() => { setConfirmDelete(false); onDelete() }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <p className="maint-project-name">{entry.projectName}</p>
      {entry.replacementParts && <div className="maint-field"><span className="maint-label">Parts:</span><span className="maint-value">{entry.replacementParts}</span></div>}
      {entry.workDoneBy      && <div className="maint-field"><span className="maint-label">Work by:</span><span className="maint-value">{entry.workDoneBy}</span></div>}
      {entry.approxCost      && <div className="maint-field"><span className="maint-label">Cost:</span><span className="maint-value">${entry.approxCost}</span></div>}
      {entry.notes           && <p className="maint-notes">{entry.notes}</p>}
    </div>
  )
}

function EntryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))
  const handleSave = () => { if (!form.projectName.trim()) return; onSave(form) }

  return (
    <div className="maint-form">
      <div className="maint-form-row">
        <label className="maint-form-label">Date</label>
        <input type="date" className="add-input" value={form.date} onChange={e => set('date', e.target.value)} />
      </div>
      <div className="maint-form-row">
        <label className="maint-form-label">Project Name *</label>
        <input className="add-input add-input--name" placeholder="e.g. Engine oil change" value={form.projectName} onChange={e => set('projectName', e.target.value)} />
      </div>
      <div className="maint-form-row">
        <label className="maint-form-label">Replacement Parts</label>
        <input className="add-input add-input--name" placeholder="e.g. Oil filter, 5L Mobil 1" value={form.replacementParts} onChange={e => set('replacementParts', e.target.value)} />
      </div>
      <div className="maint-form-row">
        <label className="maint-form-label">Work Done By</label>
        <input className="add-input add-input--name" placeholder="e.g. Pete Ross" value={form.workDoneBy} onChange={e => set('workDoneBy', e.target.value)} />
      </div>
      <div className="maint-form-row">
        <label className="maint-form-label">Approx. Cost ($)</label>
        <input className="add-input" type="number" placeholder="0.00" value={form.approxCost} onChange={e => set('approxCost', e.target.value)} style={{ width: 120 }} />
      </div>
      <div className="maint-form-row maint-form-row--col">
        <label className="maint-form-label">Project Notes</label>
        <textarea className="log-textarea" placeholder="Describe the work done, observations, next service interval..." value={form.notes} onChange={e => set('notes', e.target.value)} rows={4} />
      </div>
      <div className="maint-form-btns">
        <button className="add-btn" onClick={handleSave}>Save Entry</button>
        <button className="voyage-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Future projects components ───────────────────────────

function PartsDialog({ project, onAddPart, onTogglePart, onDeletePart, onClose }) {
  const [newPart, setNewPart] = useState('')
  const checked   = project.parts.filter(p => p.checked).length
  const total     = project.parts.length

  const handleAdd = () => {
    const name = newPart.trim()
    if (!name) return
    onAddPart(project.id, name)
    setNewPart('')
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog dialog--wide">
        <p className="dialog-title">🛒 Parts List</p>
        <p className="dialog-body" style={{ marginBottom: 4 }}>{project.projectName}</p>
        {total > 0 && (
          <p className="dialog-body dialog-body--dim" style={{ marginBottom: 12 }}>
            {checked} of {total} on hand
          </p>
        )}

        {/* Parts checklist */}
        <div className="parts-list">
          {project.parts.length === 0 && (
            <p className="maint-notes" style={{ textAlign: 'center', padding: '12px 0' }}>No parts added yet.</p>
          )}
          {project.parts.map(part => (
            <div key={part.id} className={`part-row ${part.checked ? 'part-row--checked' : ''}`}>
              <button
                className={`part-check ${part.checked ? 'part-check--on' : ''}`}
                onClick={() => onTogglePart(project.id, part.id)}
                aria-label={part.checked ? 'Mark not on hand' : 'Mark on hand'}
              >
                {part.checked ? '✓' : ''}
              </button>
              <span className="part-name">{part.name}</span>
              <button className="part-delete" onClick={() => onDeletePart(project.id, part.id)} aria-label="Remove part">✕</button>
            </div>
          ))}
        </div>

        {/* Add new part */}
        <div className="parts-add-row">
          <input
            className="add-input add-input--name"
            placeholder="Add a part…"
            value={newPart}
            onChange={e => setNewPart(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="add-btn" onClick={handleAdd}>Add</button>
        </div>

        <div className="dialog-btns" style={{ marginTop: 16 }}>
          <button className="dialog-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, onEdit, onDelete, onOpenParts, onAddPart, onTogglePart, onDeletePart }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showParts, setShowParts] = useState(false)
  const checked = project.parts.filter(p => p.checked).length
  const total   = project.parts.length
  const allDone = total > 0 && checked === total

  return (
    <div className="maint-card">
      <div className="maint-card-header">
        <span className={`future-badge ${allDone ? 'future-badge--ready' : ''}`}>
          {allDone ? '✓ Ready' : 'Planned'}
        </span>
        <div className="maint-card-actions">
          <button className="maint-action-btn" onClick={onEdit}>Edit</button>
          <button className="maint-action-btn maint-action-btn--danger" onClick={() => setConfirmDelete(true)}>Delete</button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Future Project?"
          body={`Delete "${project.projectName}"? This cannot be undone.`}
          confirmLabel="Yes, delete project"
          onConfirm={() => { setConfirmDelete(false); onDelete() }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <p className="maint-project-name">{project.projectName}</p>
      {project.description && <p className="maint-notes">{project.description}</p>}

      <button className="parts-list-btn" onClick={() => setShowParts(true)}>
        🛒 Parts List
        {total > 0 && <span className="parts-badge">{checked}/{total} on hand</span>}
      </button>

      {showParts && (
        <PartsDialog
          project={project}
          onAddPart={onAddPart}
          onTogglePart={onTogglePart}
          onDeletePart={onDeletePart}
          onClose={() => setShowParts(false)}
        />
      )}
    </div>
  )
}

function ProjectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { projectName: '', description: '' })
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))
  const handleSave = () => { if (!form.projectName.trim()) return; onSave(form) }

  return (
    <div className="maint-form">
      <div className="maint-form-row">
        <label className="maint-form-label">Project Name *</label>
        <input className="add-input add-input--name" placeholder="e.g. Replace standing rigging" value={form.projectName} onChange={e => set('projectName', e.target.value)} />
      </div>
      <div className="maint-form-row maint-form-row--col">
        <label className="maint-form-label">Description</label>
        <textarea className="log-textarea" placeholder="Describe the project, why it's needed, any relevant notes…" value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
      </div>
      <div className="maint-form-btns">
        <button className="add-btn" onClick={handleSave}>Save Project</button>
        <button className="voyage-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Main screen ──────────────────────────────────────────

export default function MaintenanceScreen({
  maintenance, addEntry, updateEntry, deleteEntry,
  futureProjects, addProject, updateProject, deleteProject,
  addPart, togglePart, deletePart,
}) {
  const [tab, setTab]           = useState('log')    // 'log' | 'future'
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const totalCost = maintenance.reduce((s, e) => s + (parseFloat(e.approxCost) || 0), 0)
  const readyCount = futureProjects.filter(p => p.parts.length > 0 && p.parts.every(pt => pt.checked)).length

  const handleSave = (form) => {
    if (editingId !== null) {
      tab === 'log' ? updateEntry(editingId, form) : updateProject(editingId, form)
      setEditingId(null)
    } else {
      tab === 'log' ? addEntry(form) : addProject(form)
    }
    setShowForm(false)
  }

  const handleEdit = (item) => { setEditingId(item.id); setShowForm(true) }
  const handleCancel = () => { setShowForm(false); setEditingId(null) }

  const editingItem = editingId !== null
    ? (tab === 'log' ? maintenance : futureProjects).find(e => e.id === editingId)
    : null

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">Maintenance</h1>
          <p className="screen-subtitle">
            {tab === 'log'
              ? `${maintenance.length} record${maintenance.length !== 1 ? 's' : ''}${maintenance.length > 0 ? ` · $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total` : ''}`
              : `${futureProjects.length} project${futureProjects.length !== 1 ? 's' : ''}${readyCount > 0 ? ` · ${readyCount} ready` : ''}`
            }
          </p>
        </div>
        {!showForm && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="add-btn" onClick={() => setShowForm(true)}>
              {tab === 'log' ? '+ New Entry' : '+ New Project'}
            </button>
            {tab === 'log' && maintenance.length > 0 && (
              <button className="voyage-btn" onClick={() => exportMaintenancePDF(maintenance)}>Export PDF</button>
            )}
          </div>
        )}
      </header>

      {/* Tab switcher */}
      <div className="maint-tabs">
        <button className={`maint-tab ${tab === 'log' ? 'maint-tab--active' : ''}`} onClick={() => { setTab('log'); setShowForm(false) }}>
          Service Log
        </button>
        <button className={`maint-tab ${tab === 'future' ? 'maint-tab--active' : ''}`} onClick={() => { setTab('future'); setShowForm(false) }}>
          Future Projects
        </button>
      </div>

      <div className="screen-body">
        {showForm && (
          tab === 'log'
            ? <EntryForm
                initial={editingItem ? { date: editingItem.date, projectName: editingItem.projectName, replacementParts: editingItem.replacementParts, workDoneBy: editingItem.workDoneBy, approxCost: editingItem.approxCost, notes: editingItem.notes } : undefined}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            : <ProjectForm
                initial={editingItem ? { projectName: editingItem.projectName, description: editingItem.description } : undefined}
                onSave={handleSave}
                onCancel={handleCancel}
              />
        )}

        {tab === 'log' && (
          <>
            {maintenance.length === 0 && !showForm && (
              <p className="voyage-empty">No maintenance records yet. Tap "+ New Entry" to add one.</p>
            )}
            {maintenance.map(entry => (
              <EntryCard key={entry.id} entry={entry} onEdit={() => handleEdit(entry)} onDelete={() => deleteEntry(entry.id)} />
            ))}
          </>
        )}

        {tab === 'future' && (
          <>
            {futureProjects.length === 0 && !showForm && (
              <p className="voyage-empty">No future projects yet. Tap "+ New Project" to plan one.</p>
            )}
            {futureProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => handleEdit(project)}
                onDelete={() => deleteProject(project.id)}
                onAddPart={addPart}
                onTogglePart={togglePart}
                onDeletePart={deletePart}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
