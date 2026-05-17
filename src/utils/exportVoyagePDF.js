/**
 * exportVoyagePDF — generates and auto-downloads a formatted A4 PDF for a voyage.
 *
 * Layout:
 *   - Dark navy header with voyage title and export timestamp
 *   - Voyage summary: name, start/end times, duration, status
 *   - Log entries: each shows timestamp, nav data (GPS/COG/SOG/AWA/AWS),
 *     and free-text notes, separated by a rule line
 *   - Adds a new page automatically when content approaches the bottom margin
 *
 * Nav data is rendered in Courier (monospace) for alignment.
 * File is saved as "{voyage_name}_log.pdf".
 */
import { jsPDF } from 'jspdf'

function fmt(iso) {
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function duration(start, end) {
  const ms = (end ? new Date(end) : new Date()) - new Date(start)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function exportVoyagePDF(voyage) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 16
  const col = margin
  let y = 20

  const line = (text, size = 10, bold = false, color = [30, 30, 30]) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    doc.text(text, col, y)
    y += size * 0.45 + 2
  }

  const rule = (thickness = 0.3) => {
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(thickness)
    doc.line(margin, y, W - margin, y)
    y += 4
  }

  // Header
  doc.setFillColor(11, 25, 41)
  doc.rect(0, 0, W, 28, 'F')
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(240, 235, 224)
  doc.text('CATALINA 445 — VOYAGE LOG', margin, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(196, 148, 58)
  doc.text(`Exported ${fmt(new Date().toISOString())}`, margin, 20)
  y = 36

  // Voyage summary
  line(voyage.name || voyage.destination || 'Unnamed Voyage', 14, true)
  line(`Started: ${fmt(voyage.startTime)}`, 9)
  if (voyage.endTime) line(`Ended:   ${fmt(voyage.endTime)}`, 9)
  line(`Duration: ${duration(voyage.startTime, voyage.endTime)}`, 9)
  line(`Status: ${voyage.status === 'active' ? 'UNDERWAY' : 'Completed'}`, 9)
  y += 4
  rule(0.5)

  // Log entries
  line('LOG ENTRIES', 11, true, [11, 25, 41])
  y += 2

  if (!voyage.notes || voyage.notes.length === 0) {
    line('No entries recorded.', 9, false, [120, 120, 120])
  } else {
    for (const entry of voyage.notes) {
      if (y > 270) { doc.addPage(); y = 20 }

      // Timestamp
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 100, 100)
      doc.text(fmt(entry.time), col, y)
      y += 5

      // Nav data
      const nav = [
        entry.lat && entry.lon && `GPS ${entry.lat}  ${entry.lon}`,
        entry.cog && `COG ${entry.cog}°`,
        entry.sog && `SOG ${entry.sog} kts`,
        entry.awa && `AWA ${entry.awa}°`,
        entry.aws && `AWS ${entry.aws} kts`,
      ].filter(Boolean).join('   ')

      if (nav) {
        doc.setFontSize(9)
        doc.setFont('courier', 'normal')
        doc.setTextColor(30, 30, 30)
        const wrapped = doc.splitTextToSize(nav, W - margin * 2)
        doc.text(wrapped, col, y)
        y += wrapped.length * 5
      }

      // Notes text
      if (entry.text) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(50, 50, 50)
        const wrapped = doc.splitTextToSize(entry.text, W - margin * 2)
        doc.text(wrapped, col, y)
        y += wrapped.length * 5
      }

      rule()
    }
  }

  const safeName = (voyage.name || voyage.destination || 'voyage').replace(/[^a-z0-9]/gi, '_')
  doc.save(`${safeName}_log.pdf`)
}
