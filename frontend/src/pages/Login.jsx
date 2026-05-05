import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex' }}>
      {/* Left panel */}
      <div style={{
        width: '42%', background: '#0d0d0d', padding: '48px', display: 'flex',
        flexDirection: 'column', justifyContent: 'space-between',
      }} className="hide-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#c8f135', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.5" fill="#0d0d0d"/>
              <rect x="8" y="1" width="5" height="5" rx="1.5" fill="#0d0d0d" opacity="0.4"/>
              <rect x="1" y="8" width="5" height="5" rx="1.5" fill="#0d0d0d" opacity="0.4"/>
              <rect x="8" y="8" width="5" height="5" rx="1.5" fill="#0d0d0d"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>TaskFlow</span>
        </div>

        <div>
          <p style={{ color: '#c8f135', fontSize: 13, fontWeight: 500, marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Built for teams
          </p>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.8px', marginBottom: 24 }}>
            Organize work.<br />Ship faster.
          </h2>
          <p style={{ color: '#888', fontSize: 15, lineHeight: 1.6 }}>
            Assign tasks, track progress, and keep your team in sync — all in one place.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['Projects', 'Tasks', 'Teams', 'Deadlines'].map(t => (
            <span key={t} style={{
              padding: '6px 12px', borderRadius: 99, border: '1px solid #2a2a2a',
              color: '#666', fontSize: 12, fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 6 }}>Welcome back</h1>
            <p style={{ color: '#888', fontSize: 14 }}>Sign in to your account to continue</p>
          </div>

          {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" placeholder="Enter your password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-black"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#888' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#0d0d0d', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}