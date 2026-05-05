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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1.5px solid #e8e8e8',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1080, margin: '0 auto', padding: '0 24px',
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, background: '#0d0d0d', borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white"/>
                <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
                <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
                <rect x="8" y="8" width="5" height="5" rx="1.5" fill="#c8f135"/>
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>TaskFlow</span>
          </Link>

          <nav style={{ display: 'flex', gap: 4 }}>
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Projects', path: '/projects' },
            ].map(({ label, path }) => (
              <Link key={path} to={path} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 14, fontWeight: 500,
                background: isActive(path) ? '#f0f0f0' : 'transparent',
                color: isActive(path) ? '#0d0d0d' : '#888',
                transition: 'all 0.12s',
              }}>{label}</Link>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: '#0d0d0d', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
            }}>
              {(user.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
            {user.role === 'admin' && (
              <span style={{
                fontSize: 10, fontWeight: 600, background: '#c8f135', color: '#0d0d0d',
                padding: '2px 7px', borderRadius: 99, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>Admin</span>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>
    </header>
  );
}