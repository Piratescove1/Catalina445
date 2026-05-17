import { pdfToPng } from 'pdf-to-png-converter'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pdfBuffer = readFileSync('C:/Users/pross/OneDrive - Ross Video/Documents/Scaned_Documents/445 Compartments.pdf')

const pages = await pdfToPng(pdfBuffer, {
  pagesToProcess: [1],
  outputFolder: path.join(__dirname, 'public'),
  outputFileMask: 'boat-plan',
  viewportScale: 3.0,
})
console.log('Done:', pages.map(p => p.path))
