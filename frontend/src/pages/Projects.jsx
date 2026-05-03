import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) return <><Navbar /><div className="spinner" /></>;

  return (
    <>
      <Navbar />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800 }}>Projects</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Create Project</h3>
            {error && <div className="error-msg" style={{ marginBottom: '14px' }}>{error}</div>}
            <form onSubmit={createProject}>
              <div className="form-group">
                <label className="label">Project Name</label>
                <input placeholder="e.g. Website Redesign" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Description (optional)</label>
                <textarea placeholder="What's this project about?" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>
              <button className="btn-primary" type="submit">Create Project →</button>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            No projects yet. Create one to get started!
          </div>
        ) : (
          <div className="grid-2">
            {projects.map(p => (
              <div key={p.id} className="card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <Link to={`/projects/${p.id}`} style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                    {p.name}
                  </Link>
                  <button className="btn-danger btn-sm" onClick={() => deleteProject(p.id)}>Delete</button>
                </div>
                {p.description && (
                  <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>{p.description}</p>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                  <span>👤 {p.owner_name}</span>
                  <span>📋 {p.done_count}/{p.task_count} tasks done</span>
                </div>

                {/* Progress bar */}
                <div style={{ background: 'var(--surface2)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--accent)',
                    width: `${p.task_count > 0 ? (p.done_count / p.task_count) * 100 : 0}%`,
                    transition: 'width 0.3s',
                  }} />
                </div>

                <Link to={`/projects/${p.id}`}>
                  <button className="btn-secondary" style={{ width: '100%', marginTop: '16px' }}>Open Project →</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}