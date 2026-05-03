import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navStyle = {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const linkStyle = (path) => ({
    color: location.pathname === path ? 'var(--accent)' : 'var(--muted)',
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
    padding: '6px 0',
    borderBottom: location.pathname === path ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'all 0.2s',
  });

  return (
    <nav style={navStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/dashboard" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', color: 'var(--accent)', letterSpacing: '-0.5px' }}>
          TASKFLOW
        </Link>
        <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
        <Link to="/projects" style={linkStyle('/projects')}>Projects</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {user.name} {user.role === 'admin' && <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>[admin]</span>}
        </span>
        <button className="btn-secondary btn-sm" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}