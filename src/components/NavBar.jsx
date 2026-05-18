const TABS = [
  { id: 'inventory',   icon: '⚓', label: "Ship's Stores", sub: 'Inventory' },
  { id: 'voyage',      icon: '🧭', label: 'Voyage Log',    sub: 'Log & GPS' },
  { id: 'maintenance', icon: '🔧', label: 'Maintenance',   sub: 'Service Log' },
  { id: 'provisions',  icon: '🛒', label: 'Provisions',    sub: 'Shopping' },
  { id: 'ditchbag',   icon: '🆘', label: 'Ditch Bag',      sub: 'Abandon Ship', ditch: true },
]

export default function NavBar({ active, onNavigate }) {
  return (
    <nav className="navbar">
      {TABS.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            className={[
              'nav-btn',
              tab.ditch  ? 'nav-btn--ditch'       : '',
              isActive   ? 'nav-btn--active'       : '',
              isActive && tab.ditch ? 'nav-btn--ditch-active' : '',
            ].join(' ')}
            onClick={() => onNavigate(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <span className={`nav-indicator ${tab.ditch ? 'nav-indicator--ditch' : ''}`} />
            )}
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
            <span className="nav-sublabel">{tab.sub}</span>
          </button>
        )
      })}
    </nav>
  )
}
