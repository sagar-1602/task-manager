import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const isAdmin = project?.members?.find(m => m.id === user.id)?.role === 'admin';

  const createTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tasks', { ...taskForm, project_id: parseInt(id), assigned_to: taskForm.assigned_to || null });
      setTaskForm({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });
      setShowTaskForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      setSuccess('Member added successfully!');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const isOverdue = (due_date, status) => {
    if (!due_date || status === 'done') return false;
    return new Date(due_date) < new Date();
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return <><Navbar /><div className="spinner" /></>;
  if (!project) return <><Navbar /><div className="page" style={{ color: 'var(--muted)' }}>Project not found. <Link to="/projects" style={{ color: 'var(--accent)' }}>Back</Link></div></>;

  return (
    <>
      <Navbar />
      <div className="page">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link to="/projects" style={{ color: 'var(--muted)', fontSize: '12px' }}>← Back to Projects</Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{project.name}</h1>
          {project.description && <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>{project.description}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
          {/* Tasks Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'todo', 'in-progress', 'done'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{
                      padding: '5px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '20px',
                      background: filter === f ? 'var(--accent)' : 'var(--surface2)',
                      color: filter === f ? '#000' : 'var(--muted)',
                      border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                    {f}
                  </button>
                ))}
              </div>
              <button className="btn-primary btn-sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                {showTaskForm ? '✕ Cancel' : '+ Add Task'}
              </button>
            </div>

            {showTaskForm && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>New Task</h3>
                {error && <div className="error-msg" style={{ marginBottom: '12px' }}>{error}</div>}
                <form onSubmit={createTask}>
                  <div className="form-group">
                    <label className="label">Title</label>
                    <input placeholder="Task title" value={taskForm.title}
                      onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="label">Description</label>
                    <textarea placeholder="Details..." value={taskForm.description}
                      onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                      style={{ minHeight: '70px', resize: 'vertical' }} />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="label">Assign To</label>
                      <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                        <option value="">Unassigned</option>
                        {project.members?.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="label">Priority</label>
                      <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Due Date</label>
                    <input type="date" value={taskForm.due_date}
                      onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                  </div>
                  <button className="btn-primary" type="submit">Create Task →</button>
                </form>
              </div>
            )}

            {filteredTasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
                No tasks {filter !== 'all' ? `with status "${filter}"` : 'yet'}. Add one above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredTasks.map(task => (
                  <div key={task.id} className="card" style={{ borderLeft: `3px solid ${task.status === 'done' ? 'var(--accent)' : task.status === 'in-progress' ? 'var(--accent2)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, flex: 1 }}>{task.title}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        <button className="btn-danger btn-sm" onClick={() => deleteTask(task.id)}>✕</button>
                      </div>
                    </div>
                    {task.description && (
                      <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '10px', lineHeight: '1.5' }}>{task.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {task.assigned_to_name && <span>👤 {task.assigned_to_name}</span>}
                      {task.due_date && (
                        <span className={isOverdue(task.due_date, task.status) ? 'overdue' : ''}>
                          📅 {task.due_date} {isOverdue(task.due_date, task.status) && '⚠ overdue'}
                        </span>
                      )}
                      <span style={{ color: 'var(--muted)' }}>by {task.created_by_name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                      <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
                        style={{ width: 'auto', fontSize: '11px', padding: '4px 8px' }}>
                        <option value="todo">Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Members */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                Team ({project.members?.length || 0})
              </h3>
              {project.members?.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{m.email}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: m.role === 'admin' ? 'var(--accent)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{m.role}</span>
                </div>
              ))}

              {isAdmin && (
                <div style={{ marginTop: '16px' }}>
                  <button className="btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setShowMemberForm(!showMemberForm)}>
                    {showMemberForm ? 'Cancel' : '+ Add Member'}
                  </button>
                  {showMemberForm && (
                    <form onSubmit={addMember} style={{ marginTop: '12px' }}>
                      {error && <div className="error-msg" style={{ marginBottom: '8px', fontSize: '12px' }}>{error}</div>}
                      {success && <div className="success-msg" style={{ marginBottom: '8px', fontSize: '12px' }}>{success}</div>}
                      <input placeholder="member@email.com" value={memberEmail}
                        onChange={e => setMemberEmail(e.target.value)} required style={{ marginBottom: '8px' }} />
                      <button className="btn-primary btn-sm" type="submit" style={{ width: '100%' }}>Add →</button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Progress</h3>
              {['todo', 'in-progress', 'done'].map(s => {
                const count = tasks.filter(t => t.status === s).length;
                const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                return (
                  <div key={s} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--muted)' }}>{s}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: '3px', height: '3px' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: s === 'done' ? 'var(--accent)' : s === 'in-progress' ? 'var(--accent2)' : 'var(--border)',
                        width: `${pct}%`,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}