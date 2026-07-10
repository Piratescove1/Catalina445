import { PLANS, formatDate } from '../lib/license'

const STATUS_TEXT = {
  active: (l) => `Active — paid through ${formatDate(l.effectiveUntil)} (${l.daysLeft} days left).`,
  trial: (l) => `Free trial — ${l.daysLeft} day${l.daysLeft === 1 ? '' : 's'} left.`,
  expired: () => 'Expired. Renew to restore cloud sync and cloud backups.',
}

export default function LicenseScreen({ license, onClose, onCheckout }) {
  return (
    <div className="help-overlay">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="help-header">
          <p className="help-title">Subscription</p>
          <button className="log-form-cancel" onClick={onClose}>✕</button>
        </div>

        <div className={`lic-status lic-status--${license.status}`}>
          {(STATUS_TEXT[license.status] || (() => ''))(license)}
        </div>

        <p className="auth-note">Choose a term — one purchase covers your whole boat (all crew, all devices).
        Terms don’t auto-renew; you buy again when you’re ready.</p>

        <div className="lic-plans">
          {PLANS.map(p => (
            <div key={p.id} className="lic-plan">
              <div>
                <p className="lic-plan-label">{p.label}</p>
                <p className="lic-plan-price">{p.priceLabel === 'TBD' ? 'Price coming soon' : p.priceLabel}</p>
              </div>
              <button className="auth-btn lic-buy" onClick={() => onCheckout(p)}>Choose</button>
            </div>
          ))}
        </div>

        <p className="auth-hint">Your inventory, voyages and safety info always stay available offline — a lapsed
        term only pauses cloud sync and cloud backups.</p>
        <button className="sync-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
