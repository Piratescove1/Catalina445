/**
 * license.js — per-boat licensing (Phase 4, app side).
 *
 * A license is just a "paid until" date. The real date will be written to
 * Firestore licenses/{boatId} by the Stripe webhook (Phase 4b); the client only
 * READS it and caches it locally so the check works offline. Until a paid
 * license exists, a local trial applies.
 *
 * Enforcement is deliberately soft: when lapsed we disable cloud premium
 * (sync/backups) and nag, but never lock the user out of their own data —
 * critical for a safety app used offshore.
 */
import { doc, getDoc } from 'firebase/firestore'
import { db, configured } from './firebase.js'

export const TRIAL_DAYS = 30
const DAY_MS = 86_400_000
const LICENSE_KEY = 'c445-license'      // cached { paidUntil: ms }
const TRIAL_KEY = 'c445-trial-start'    // ms

// Plans — set priceLabel/priceId once Stripe is configured (Phase 4b).
export const PLANS = [
  { id: '1m', label: '1 Month', months: 1, priceLabel: 'TBD', priceId: '' },
  { id: '6m', label: '6 Months', months: 6, priceLabel: 'TBD', priceId: '' },
  { id: '1y', label: '1 Year', months: 12, priceLabel: 'TBD', priceId: '' },
]

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }

export function getTrialStart() {
  let s = num(localStorage.getItem(TRIAL_KEY))
  if (!s) { s = Date.now(); localStorage.setItem(TRIAL_KEY, String(s)) }
  return s
}

export function loadCachedLicense() {
  try { return JSON.parse(localStorage.getItem(LICENSE_KEY)) } catch { return null }
}
export function saveCachedLicense(lic) {
  if (lic && lic.paidUntil) localStorage.setItem(LICENSE_KEY, JSON.stringify({ paidUntil: num(lic.paidUntil) }))
}

// Pull the authoritative license from the cloud (written by the Stripe webhook).
// Returns null if absent/denied/offline; caches it locally for offline checks.
export async function fetchCloudLicense(boatId) {
  if (!configured || !db || !boatId) return null
  try {
    const snap = await getDoc(doc(db, 'licenses', boatId))
    if (snap.exists()) {
      const lic = { paidUntil: num(snap.data().paidUntil) }
      saveCachedLicense(lic)
      return lic
    }
  } catch { /* denied / offline — fall back to cache/trial */ }
  return null
}

// Compute current status from cached license + local trial.
export function computeLicense(now = Date.now()) {
  const cached = loadCachedLicense()
  const paidUntil = cached ? num(cached.paidUntil) : 0
  const trialEnd = getTrialStart() + TRIAL_DAYS * DAY_MS
  const effectiveUntil = Math.max(paidUntil, trialEnd)
  const daysLeft = Math.max(0, Math.ceil((effectiveUntil - now) / DAY_MS))

  let status
  if (now > effectiveUntil) status = 'expired'
  else if (paidUntil > now && paidUntil >= trialEnd) status = 'active'
  else status = 'trial'

  return { status, paidUntil, trialEnd, effectiveUntil, daysLeft, premiumActive: now <= effectiveUntil }
}

export function formatDate(ms) {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}
