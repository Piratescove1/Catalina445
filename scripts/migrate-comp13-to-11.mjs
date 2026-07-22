import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'AIzaSyB-jX07ElYFzIHiMSV-1_NKsILU8njqhmg',
  authDomain:        'c445-voyagemaker.firebaseapp.com',
  projectId:         'c445-voyagemaker',
  storageBucket:     'c445-voyagemaker.firebasestorage.app',
  messagingSenderId: '833817687416',
  appId:             '1:833817687416:web:afe1754654e2c432a2448d',
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

const BOAT_ID = 'G3RJC6'

const snap = await getDoc(doc(db, 'boats', BOAT_ID))
if (!snap.exists()) { console.error('Boat not found'); process.exit(1) }

const data = snap.data()
const inventory = data.inventory || {}

const from = inventory['comp-13'] || []
const to   = inventory['comp-11'] || []

if (!from.length) { console.log('comp-13 is empty, nothing to move'); process.exit(0) }

console.log(`Moving ${from.length} item(s) from comp-13 to comp-11:`)
from.forEach(i => console.log(`  ${i.qty} × ${i.name}`))

// Merge into comp-11, adding qty if item name already exists there
const merged = [...to]
for (const item of from) {
  const existing = merged.find(i => i.name.toLowerCase() === item.name.toLowerCase())
  if (existing) {
    existing.qty += item.qty
  } else {
    merged.push(item)
  }
}

const updatedInventory = { ...inventory, 'comp-11': merged, 'comp-13': [] }

await setDoc(doc(db, 'boats', BOAT_ID), { ...data, inventory: updatedInventory })
console.log('Done — inventory moved from comp-13 to comp-11.')
process.exit(0)
