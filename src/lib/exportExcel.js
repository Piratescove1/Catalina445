import * as XLSX from 'xlsx'
import { COMPARTMENTS } from '../data/compartments'
import { LOCKERS } from '../data/lockers'

function fmt(isoStr) {
  if (!isoStr) return ''
  try { return new Date(isoStr).toLocaleString() } catch { return isoStr }
}

function makeCompartmentsSheet(inventory) {
  const rows = [['Compartment', 'Item', 'Qty', 'Unit', 'Added']]
  for (const comp of COMPARTMENTS) {
    const items = inventory[comp.id] || []
    if (items.length === 0) {
      rows.push([comp.name, '', '', '', ''])
    } else {
      for (const it of items) {
        rows.push([comp.name, it.name, it.qty, it.unit || '', fmt(it.addedAt)])
      }
    }
  }
  return XLSX.utils.aoa_to_sheet(rows)
}

function makeLockersSheet(lockerInventory) {
  const rows = [['Locker / Drawer', 'Item', 'Qty', 'Unit', 'Added']]
  for (const locker of LOCKERS) {
    const items = lockerInventory[locker.id] || []
    if (items.length === 0) {
      rows.push([locker.name, '', '', '', ''])
    } else {
      for (const it of items) {
        rows.push([locker.name, it.name, it.qty, it.unit || '', fmt(it.addedAt)])
      }
    }
  }
  return XLSX.utils.aoa_to_sheet(rows)
}

function makeVoyageSheet(voyages) {
  const rows = [['Voyage', 'Status', 'Start', 'End', 'Time', 'Log Entry', 'Lat', 'Lon', 'COG', 'SOG', 'AWA', 'AWS']]
  for (const v of voyages) {
    const name = v.name || v.destination || '(unnamed)'
    if (!v.notes || v.notes.length === 0) {
      rows.push([name, v.status, fmt(v.startTime), fmt(v.endTime), '', '', '', '', '', '', '', ''])
    } else {
      for (let i = 0; i < v.notes.length; i++) {
        const n = v.notes[i]
        rows.push([
          i === 0 ? name : '',
          i === 0 ? v.status : '',
          i === 0 ? fmt(v.startTime) : '',
          i === 0 ? fmt(v.endTime) : '',
          fmt(n.time),
          n.text || '',
          n.lat ?? '', n.lon ?? '', n.cog ?? '', n.sog ?? '', n.awa ?? '', n.aws ?? '',
        ])
      }
    }
  }
  return XLSX.utils.aoa_to_sheet(rows)
}

function makeMaintenanceSheet(maintenance) {
  const rows = [['Date', 'Project', 'Work Done By', 'Replacement Parts', 'Approx Cost', 'Notes']]
  for (const e of maintenance) {
    rows.push([e.date || '', e.projectName || '', e.workDoneBy || '', e.replacementParts || '', e.approxCost || '', e.notes || ''])
  }
  return XLSX.utils.aoa_to_sheet(rows)
}

function makeFutureProjectsSheet(futureProjects) {
  const rows = [['Project', 'Description', 'Part', 'Acquired']]
  for (const p of futureProjects) {
    if (!p.parts || p.parts.length === 0) {
      rows.push([p.projectName || '', p.description || '', '', ''])
    } else {
      for (let i = 0; i < p.parts.length; i++) {
        const pt = p.parts[i]
        rows.push([
          i === 0 ? (p.projectName || '') : '',
          i === 0 ? (p.description || '') : '',
          pt.name,
          pt.checked ? 'Yes' : 'No',
        ])
      }
    }
  }
  return XLSX.utils.aoa_to_sheet(rows)
}

function makeDitchBagSheet(sop, ditchItems) {
  const rows = []
  if (sop) {
    rows.push(['Abandon Ship SOP'])
    rows.push([sop])
    rows.push([])
  }
  rows.push(['Item', 'Qty', 'Packed'])
  for (const it of ditchItems) {
    rows.push([it.name, it.qty, it.packed ? 'Yes' : 'No'])
  }
  return XLSX.utils.aoa_to_sheet(rows)
}

export function exportToExcel({ inventory, lockerInventory, voyages, maintenance, futureProjects, sop, ditchItems, boatName }) {
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, makeCompartmentsSheet(inventory),           'Compartments')
  XLSX.utils.book_append_sheet(wb, makeLockersSheet(lockerInventory),          'Lockers & Drawers')
  XLSX.utils.book_append_sheet(wb, makeVoyageSheet(voyages),                   'Voyage Log')
  XLSX.utils.book_append_sheet(wb, makeMaintenanceSheet(maintenance),          'Maintenance Log')
  XLSX.utils.book_append_sheet(wb, makeFutureProjectsSheet(futureProjects),    'Future Projects')
  XLSX.utils.book_append_sheet(wb, makeDitchBagSheet(sop, ditchItems),         'Ditch Bag')

  const date = new Date().toISOString().slice(0, 10)
  const name = (boatName || 'catalina445').replace(/\s+/g, '-')
  XLSX.writeFile(wb, `${name}-backup-${date}.xlsx`)
}
