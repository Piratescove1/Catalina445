export default function NavBar({ active, onNavigate }) {
  return (
    <nav className="navbar">
      <button
        className={`nav-btn ${active === 'inventory' ? 'nav-btn--active' : ''}`}
        onClick={() => onNavigate('inventory')}
        aria-label="Inventory screen"
      >
        {active === 'inventory' && <span className="nav-indicator" />}
        <span className="nav-icon">⚓</span>
        <span className="nav-label">Ship's Stores</span>
        <span className="nav-sublabel">Inventory</span>
      </button>
      <button
        className={`nav-btn ${active === 'voyage' ? 'nav-btn--active' : ''}`}
        onClick={() => onNavigate('voyage')}
        aria-label="Voyage log screen"
      >
        {active === 'voyage' && <span className="nav-indicator" />}
        <span className="nav-icon">🧭</span>
        <span className="nav-label">Voyage Log</span>
        <span className="nav-sublabel">Log & GPS</span>
      </button>
    </nav>
  )
}
