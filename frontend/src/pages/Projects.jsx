import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [memberEmails, setMemberEmails] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(err => console.error('load projects error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createProject = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setCreating(true);
    try {
      const res = await api.post('/projects', {
        name: form.name.trim(),
        description: form.description.trim(),
      });

      const projectId = res.data.id;

      // Add members by email if any were entered
      if (memberEmails.trim()) {
        const emails = memberEmails.split(',').map(e => e.trim()).filter(Boolean);
        const failed = [];
        for (const email of emails) {
          try {
            await api.post(`/projects/${projectId}/members`, { email });
          } catch {
            failed.push(email);
          }
        }
        if (failed.length > 0) {
          setSuccess(`Project created! Could not find users: ${failed.join(', ')} — make sure they signed up first.`);
        }
      }

      setForm({ name: '', description: '' });
      setMemberEmails('');
      setShowForm(false);
      load();
    } catch (err) {
      console.error('create project error:', err);
      setError(err.response?.data?.error || 'Failed to create project. Try again.');
    } finally {
      setCreating(false);
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

  if (loading) return <><Navbar /><div className="spin" /></>;

  return (
    <>
      <Navbar />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <p style={{ color: '#888', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Workspace</p>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px' }}>Projects</h1>
          </div>
          <button className="btn btn-black" onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
            {showForm ? 'Cancel' : '+ New project'}
          </button>
        </div>

        {success && <div className="success" style={{ marginBottom: 20 }}>{success}</div>}

        {showForm && (
          <div style={{ background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 12, padding: 24, marginBottom: 32 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Create a project</h3>
            {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}
            <form onSubmit={createProject}>
              <div className="form-group">
                <label className="label">Project name *</label>
                <input
                  placeholder="e.g. Website Redesign"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  placeholder="What's this project about?"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: 80, resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label className="label">Invite team members</label>
                <input
                  placeholder="email1@example.com, email2@example.com"
                  value={memberEmails}
                  onChange={e => setMemberEmails(e.target.value)}
                />
                <p style={{ fontSize: 12, color: '#888', marginTop: 5 }}>
                  Separate multiple emails with commas. Members must have signed up already.
                </p>
              </div>
              <button className="btn btn-black" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create project'}
              </button>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 12, padding: '80px 24px', textAlign: 'center' }}>
            <p style={{ fontWeight: 500, marginBottom: 8 }}>No projects yet</p>
            <p style={{ color: '#888', fontSize: 14 }}>Create your first project to get started.</p>
          </div>
        ) : (
          <div className="grid-2">
            {projects.map(p => {
              const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
              return (
                <div key={p.id} style={{ background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.2px', marginBottom: 4 }}>{p.name}</h3>
                      {p.description && (
                        <p style={{ color: '#888', fontSize: 13, lineHeight: 1.5 }}>{p.description}</p>
                      )}
                    </div>
                    <button className="btn-danger" onClick={() => deleteProject(p.id)} style={{ marginLeft: 12, flexShrink: 0 }}>Delete</button>
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888' }}>
                    <span>by {p.owner_name}</span>
                    <span>{p.task_count} tasks · {p.done_count} done</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                      <span>Progress</span><span>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <Link to={`/projects/${p.id}`}>
                    <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                      Open project →
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}