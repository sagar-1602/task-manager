import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/signup', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex' }}>
      <div style={{
        width: '42%', background: '#0d0d0d', padding: '48px', display: 'flex',
        flexDirection: 'column', justifyContent: 'space-between',
      }} className="hide-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#c8f135', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '⬡', title: 'Role-based access', desc: 'Admin and member roles per project' },
              { icon: '⬡', title: 'Task tracking', desc: 'Priorities, deadlines, assignees' },
              { icon: '⬡', title: 'Team management', desc: 'Invite members by email instantly' },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8f135', marginTop: 7, flexShrink: 0 }} />
                <div>
                  <p style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{title}</p>
                  <p style={{ color: '#666', fontSize: 13 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: '#444', fontSize: 12 }}>First account created gets Admin access automatically.</p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 6 }}>Create account</h1>
            <p style={{ color: '#888', fontSize: 14 }}>Get started with TaskFlow for free</p>
          </div>

          {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Full name</label>
              <input placeholder="John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-black"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#888' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0d0d0d', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}