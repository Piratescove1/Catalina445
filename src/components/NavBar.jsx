export default function NavBar({ active, onNavigate }) {
  return (
    <nav className="navbar">
      {/* Row 1: col 1 */}
      <button
        style={{ gridColumn: 1, gridRow: 1 }}
        className={`nav-btn ${active === 'inventory' ? 'nav-btn--active' : ''}`}
        onClick={() => onNavigate('inventory')}
        aria-label="Inventory screen"
      >
        {active === 'inventory' && <span className="nav-indicator" />}
        <span className="nav-icon">⚓</span>
        <span className="nav-label">Ship's Stores</span>
        <span className="nav-sublabel">Inventory</span>
      </button>

      {/* Row 1: col 2 */}
      <button
        style={{ gridColumn: 2, gridRow: 1 }}
        className={`nav-btn ${active === 'voyage' ? 'nav-btn--active' : ''}`}
        onClick={() => onNavigate('voyage')}
        aria-label="Voyage log screen"
      >
        {active === 'voyage' && <span className="nav-indicator" />}
        <span className="nav-icon">🧭</span>
        <span className="nav-label">Voyage Log</span>
        <span className="nav-sublabel">Log & GPS</span>
      </button>

      {/* Row 1: col 3 */}
      <button
        style={{ gridColumn: 3, gridRow: 1 }}
        className={`nav-btn nav-btn--last ${active === 'maintenance' ? 'nav-btn--active' : ''}`}
        onClick={() => onNavigate('maintenance')}
        aria-label="Maintenance log screen"
      >
        {active === 'maintenance' && <span className="nav-indicator" />}
        <span className="nav-icon">🔧</span>
        <span className="nav-label">Maintenance</span>
        <span className="nav-sublabel">Service Log</span>
      </button>

      {/* Row 2: col 2 — Ditch Bag centered under Voyage Log */}
      <button
        style={{ gridColumn: 2, gridRow: 2 }}
        className={`nav-btn nav-btn--ditch ${active === 'ditchbag' ? 'nav-btn--active nav-btn--ditch-active' : ''}`}
        onClick={() => onNavigate('ditchbag')}
        aria-label="Ditch bag screen"
      >
        {active === 'ditchbag' && <span className="nav-indicator nav-indicator--ditch" />}
        <span className="nav-icon">🆘</span>
        <span className="nav-label">Ditch Bag</span>
        <span className="nav-sublabel">Abandon Ship</span>
      </button>
    </nav>
  )
}
