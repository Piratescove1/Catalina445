import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

// Use pdfjs-dist to render the PDF page to a PNG
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

const loadingTask = pdfjsLib.getDocument({
  url: 'C:\\Users\\pross\\OneDrive - Ross Video\\Documents\\Scaned_Documents\\445 Compartments.pdf',
  useSystemFonts: true,
})

const pdf = await loadingTask.promise
const page = await pdf.getPage(1)
const scale = 3.0
const viewport = page.getViewport({ scale })

const canvas = createCanvas(viewport.width, viewport.height)
const ctx = canvas.getContext('2d')

await page.render({ canvasContext: ctx, viewport }).promise

const buf = canvas.toBuffer('image/png')
writeFileSync('public/boat-plan.png', buf)
console.log(`Saved ${viewport.width}x${viewport.height} boat-plan.png`)
