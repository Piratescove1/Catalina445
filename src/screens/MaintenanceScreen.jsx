import { useState } from 'react'

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

function EntryCard({ entry, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="maint-card">
      <div className="maint-card-header">
        <span className="maint-date">{formatDate(entry.date)}</span>
        <div className="maint-card-actions">
          <button className="maint-action-btn" onClick={onEdit}>Edit</button>
          {confirmDelete
            ? <>
                <button className="maint-action-btn maint-action-btn--danger" onClick={onDelete}>Confirm Delete</button>
                <button className="maint-action-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </>
            : <button className="maint-action-btn maint-action-btn--danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          }
        </div>
      </div>
      <p className="maint-project-name">{entry.projectName}</p>
      {entry.replacementParts && (
        <div className="maint-field">
          <span className="maint-label">Parts:</span>
          <span className="maint-value">{entry.replacementParts}</span>
        </div>
      )}
      {entry.workDoneBy && (
        <div className="maint-field">
          <span className="maint-label">Work by:</span>
          <span className="maint-value">{entry.workDoneBy}</span>
        </div>
      )}
      {entry.approxCost && (
        <div className="maint-field">
          <span className="maint-label">Cost:</span>
          <span className="maint-value">${entry.approxCost}</span>
        </div>
      )}
      {entry.notes && (
        <p className="maint-notes">{entry.notes}</p>
      )}
    </div>
  )
}

function EntryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = () => {
    if (!form.projectName.trim()) return
    onSave(form)
  }

  return (
    <div className="maint-form">
      <div className="maint-form-row">
        <label className="maint-form-label">Date</label>
        <input
          type="date"
          className="add-input"
          value={form.date}
          onChange={e => set('date', e.target.value)}
        />
      </div>
      <div className="maint-form-row">
        <label className="maint-form-label">Project Name *</label>
        <input
          className="add-input add-input--name"
          placeholder="e.g. Engine oil change"
          value={form.projectName}
          onChange={e => set('projectName', e.target.value)}
        />
      </div>
      <div className="maint-form-row">
        <label className="maint-form-label">Replacement Parts</label>
        <input
          className="add-input add-input--name"
          placeholder="e.g. Oil filter, 5L Mobil 1"
          value={form.replacementParts}
          onChange={e => set('replacementParts', e.target.value)}
        />
      </div>
      <div className="maint-form-row">
        <label className="maint-form-label">Work Done By</label>
        <input
          className="add-input add-input--name"
          placeholder="e.g. Pete Ross"
          value={form.workDoneBy}
          onChange={e => set('workDoneBy', e.target.value)}
        />
      </div>
      <div className="maint-form-row">
        <label className="maint-form-label">Approx. Cost ($)</label>
        <input
          className="add-input"
          type="number"
          placeholder="0.00"
          value={form.approxCost}
          onChange={e => set('approxCost', e.target.value)}
          style={{ width: 120 }}
        />
      </div>
      <div className="maint-form-row maint-form-row--col">
        <label className="maint-form-label">Project Notes</label>
        <textarea
          className="log-textarea"
          placeholder="Describe the work done, observations, next service interval..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={4}
        />
      </div>
      <div className="maint-form-btns">
        <button className="add-btn" onClick={handleSave}>Save Entry</button>
        <button className="voyage-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default function MaintenanceScreen({ maintenance, addEntry, updateEntry, deleteEntry }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const totalCost = maintenance.reduce((s, e) => s + (parseFloat(e.approxCost) || 0), 0)

  const handleSave = (form) => {
    if (editingId !== null) {
      updateEntry(editingId, form)
      setEditingId(null)
    } else {
      addEntry(form)
    }
    setShowForm(false)
  }

  const handleEdit = (entry) => {
    setEditingId(entry.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const editingEntry = editingId !== null ? maintenance.find(e => e.id === editingId) : null

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">Maintenance Log</h1>
          <p className="screen-subtitle">
            {maintenance.length} {maintenance.length === 1 ? 'record' : 'records'}
            {maintenance.length > 0 && ` · $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total`}
          </p>
        </div>
        {!showForm && (
          <button className="add-btn" onClick={() => setShowForm(true)}>+ New Entry</button>
        )}
      </header>

      <div className="screen-body">
        {showForm && (
          <EntryForm
            initial={editingEntry ? {
              date: editingEntry.date,
              projectName: editingEntry.projectName,
              replacementParts: editingEntry.replacementParts,
              workDoneBy: editingEntry.workDoneBy,
              approxCost: editingEntry.approxCost,
              notes: editingEntry.notes,
            } : undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {maintenance.length === 0 && !showForm && (
          <p className="voyage-empty">No maintenance records yet. Tap "+ New Entry" to add one.</p>
        )}

        {maintenance.map(entry => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={() => handleEdit(entry)}
            onDelete={() => deleteEntry(entry.id)}
          />
        ))}
      </div>
    </div>
  )
}
