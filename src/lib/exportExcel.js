import * as XLSX from 'xlsx'
import { DEFAULT_COMPARTMENTS } from '../data/compartments'
import { LOCKERS } from '../data/lockers'

function fmt(isoStr) {
  if (!isoStr) return ''
  try { return new Date(isoStr).toLocaleString() } catch { return isoStr }
}

function makeCompartmentsSheet(inventory, compartments) {
  const rows = [['Compartment', 'Item', 'Qty', 'Unit', 'Added']]
  for (const comp of compartments) {
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
  const rows = [['Voyage', 'Sail', 'Status', 'Start', 'End', 'Time', 'Log Entry', 'Lat', 'Lon', 'COG', 'SOG', 'AWA', 'AWS']]
  for (const v of voyages) {
    const vName = v.name || v.destination || '(unnamed)'
    const sails = v.sails || []
    if (sails.length === 0) {
      rows.push([vName, '', v.status, fmt(v.startTime), fmt(v.endTime), '', '', '', '', '', '', '', ''])
      continue
    }
    let firstVoyageRow = true
    for (let si = 0; si < sails.length; si++) {
      const sail = sails[si]
      const sailName = sail.name || `Sail ${si + 1}`
      const notes = sail.notes || []
      if (notes.length === 0) {
        rows.push([firstVoyageRow ? vName : '', sailName, sail.status, fmt(sail.startTime), fmt(sail.endTime), '', '', '', '', '', '', '', ''])
        firstVoyageRow = false
        continue
      }
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i]
        rows.push([
          firstVoyageRow && i === 0 ? vName : '',
          i === 0 ? sailName : '',
          firstVoyageRow && i === 0 ? v.status : '',
          firstVoyageRow && i === 0 ? fmt(v.startTime) : '',
          firstVoyageRow && i === 0 ? fmt(v.endTime) : '',
          fmt(n.time),
          n.text || '',
          n.lat ?? '', n.lon ?? '', n.cog ?? '', n.sog ?? '', n.awa ?? '', n.aws ?? '',
        ])
        if (i === 0) firstVoyageRow = false
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

function makeProvisionsSheet(provItems) {
  const rows = [['Category', 'Item', 'On List']]
  for (const it of provItems) {
    rows.push([it.category, it.name, it.checked ? 'Yes' : ''])
  }
  return XLSX.utils.aoa_to_sheet(rows)
}

export function exportToExcel({ inventory, lockerInventory, voyages, maintenance, futureProjects, sop, ditchItems, provItems, boatName, compartments = DEFAULT_COMPARTMENTS }) {
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, makeCompartmentsSheet(inventory, compartments), 'Compartments')
  XLSX.utils.book_append_sheet(wb, makeLockersSheet(lockerInventory),          'Lockers & Drawers')
  XLSX.utils.book_append_sheet(wb, makeVoyageSheet(voyages),                   'Voyage Log')
  XLSX.utils.book_append_sheet(wb, makeMaintenanceSheet(maintenance),          'Maintenance Log')
  XLSX.utils.book_append_sheet(wb, makeFutureProjectsSheet(futureProjects),    'Future Projects')
  XLSX.utils.book_append_sheet(wb, makeDitchBagSheet(sop, ditchItems),         'Ditch Bag')
  if (provItems?.length) XLSX.utils.book_append_sheet(wb, makeProvisionsSheet(provItems), 'Provisions')

  const date = new Date().toISOString().slice(0, 10)
  const name = (boatName || 'catalina445').replace(/\s+/g, '-')
  XLSX.writeFile(wb, `${name}-backup-${date}.xlsx`)
}
