/**
 * exportMaintenancePDF — generates and auto-downloads an A4 PDF of all maintenance records.
 *
 * Layout:
 *   - Dark navy header matching the voyage log style
 *   - Summary: total records and total cost
 *   - Each record: date, project name, parts, work by, cost, notes — separated by a rule
 *   - Auto page-break when content nears the bottom margin
 *
 * File is saved as "catalina445_maintenance_log.pdf".
 */
import { jsPDF } from 'jspdf'

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString([], {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtMoney(val) {
  const n = parseFloat(val)
  return isNaN(n) ? '' : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function exportMaintenancePDF(maintenance) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 16
  const col = margin
  let y = 20

  const line = (text, size = 10, bold = false, color = [30, 30, 30]) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const wrapped = doc.splitTextToSize(String(text), W - margin * 2)
    doc.text(wrapped, col, y)
    y += wrapped.length * (size * 0.45 + 1.5)
  }

  const field = (label, value) => {
    if (!value) return
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text(label, col, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    const wrapped = doc.splitTextToSize(String(value), W - margin * 2 - 40)
    doc.text(wrapped, col + 40, y)
    y += Math.max(wrapped.length, 1) * 5
  }

  const rule = (thickness = 0.3) => {
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(thickness)
    doc.line(margin, y, W - margin, y)
    y += 5
  }

  const totalCost = maintenance.reduce((s, e) => s + (parseFloat(e.approxCost) || 0), 0)
  const now = new Date().toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  // Header
  doc.setFillColor(11, 25, 41)
  doc.rect(0, 0, W, 28, 'F')
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(240, 235, 224)
  doc.text('CATALINA 445 — MAINTENANCE LOG', margin, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(196, 148, 58)
  doc.text(`Exported ${now}`, margin, 20)
  y = 36

  // Summary
  line(`${maintenance.length} record${maintenance.length !== 1 ? 's' : ''}  ·  Total cost: ${fmtMoney(totalCost)}`, 11, true, [11, 25, 41])
  y += 2
  rule(0.5)

  if (maintenance.length === 0) {
    line('No maintenance records.', 9, false, [120, 120, 120])
  } else {
    // Sort by date descending (newest first)
    const sorted = [...maintenance].sort((a, b) => b.date.localeCompare(a.date))

    for (const entry of sorted) {
      if (y > 260) { doc.addPage(); y = 20 }

      // Date
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(196, 148, 58)
      doc.text(fmtDate(entry.date), col, y)
      y += 6

      // Project name
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(11, 25, 41)
      const nameWrapped = doc.splitTextToSize(entry.projectName || 'Untitled', W - margin * 2)
      doc.text(nameWrapped, col, y)
      y += nameWrapped.length * 6 + 2

      // Fields
      field('Parts:', entry.replacementParts)
      field('Work by:', entry.workDoneBy)
      if (entry.approxCost) field('Cost:', fmtMoney(entry.approxCost))

      // Notes
      if (entry.notes) {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(80, 80, 80)
        const notesWrapped = doc.splitTextToSize(entry.notes, W - margin * 2)
        doc.text(notesWrapped, col, y)
        y += notesWrapped.length * 5
      }

      y += 2
      rule()
    }
  }

  doc.save('catalina445_maintenance_log.pdf')
}
