export default function Nav({ currentPage, onNavigate }) {
  return (
    <nav id="mainNav">
      <a className="logo" onClick={() => onNavigate('scanner')} href="#">
        <div className="logo-icon">✦</div>
        <span className="logo-name">ORION</span>
      </a>
      <div className="nav-center">
        <button
          className={`nav-btn${currentPage === 'scanner' ? ' active' : ''}`}
          onClick={() => onNavigate('scanner')}
        >
          Scanner
        </button>
        <button
          className={`nav-btn${currentPage === 'howitworks' ? ' active' : ''}`}
          onClick={() => onNavigate('howitworks')}
        >
          How It Works
        </button>
      </div>
      <div className="nav-right">
        <div className="status-pill">
          <span className="dot" />
          AI Online
        </div>
        <div className="avatar">VD</div>
      </div>
    </nav>
  );
}
