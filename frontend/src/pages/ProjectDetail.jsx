import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';

const STATUS_COLS = ['todo', 'in-progress', 'done'];
const STATUS_LABELS = { 'todo': 'To do', 'in-progress': 'In progress', 'done': 'Done' };
const STATUS_COLORS = { 'todo': '#f0f0f0', 'in-progress': '#e8f0ff', 'done': '#eeffcc' };
const STATUS_TEXT = { 'todo': '#555', 'in-progress': '#1a1aff', 'done': '#5a8400' };

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });
  const [memberEmail, setMemberEmail] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('all');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadData = async () => {
    const [proj, taskList] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`),
    ]);
    setProject(proj.data);
    setTasks(taskList.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const isAdmin = project?.members?.find(m => m.id === user.id)?.role === 'admin';

  const createTask = async (e) => {
    e.preventDefault(); setMsg({ text: '', type: '' });
    try {
      await api.post('/tasks', { ...taskForm, project_id: parseInt(id), assigned_to: taskForm.assigned_to || null });
      setTaskForm({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });
      setShowTaskForm(false); loadData();
    } catch (err) { setMsg({ text: err.response?.data?.error || 'Failed', type: 'error' }); }
  };

  const addMember = async (e) => {
    e.preventDefault(); setMsg({ text: '', type: '' });
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail(''); setMsg({ text: 'Member added!', type: 'success' });
      setShowMemberForm(false); loadData();
    } catch (err) { setMsg({ text: err.response?.data?.error || 'Failed', type: 'error' }); }
  };

  const updateStatus = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}/status`, { status });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const isOverdue = (due, status) => due && status !== 'done' && new Date(due) < new Date();
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return <><Navbar /><div className="spin" /></>;
  if (!project) return <><Navbar /><div className="page" style={{ color: '#888' }}>Project not found. <Link to="/projects" style={{ color: '#0d0d0d', textDecoration: 'underline' }}>Back</Link></div></>;

  const tasksByStatus = STATUS_COLS.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s); return acc;
  }, {});

  return (
    <>
      <Navbar />
      <div className="page">
        {/* Breadcrumb + header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Link to="/projects" style={{ color: '#888', fontSize: 13 }}>Projects</Link>
            <span style={{ color: '#ccc' }}>/</span>
            <span style={{ color: '#0d0d0d', fontSize: 13, fontWeight: 500 }}>{project.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 4 }}>{project.name}</h1>
              {project.description && <p style={{ color: '#888', fontSize: 14 }}>{project.description}</p>}
            </div>
            <button className="btn btn-black" onClick={() => { setShowTaskForm(!showTaskForm); setMsg({ text: '', type: '' }); }}>
              {showTaskForm ? 'Cancel' : '+ Add task'}
            </button>
          </div>
        </div>

        {/* Notification */}
        {msg.text && (
          <div className={msg.type === 'error' ? 'error' : 'success'} style={{ marginBottom: 20 }}>{msg.text}</div>
        )}

        {/* Task form */}
        {showTaskForm && (
          <div className="card" style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>New task</h3>
            <form onSubmit={createTask}>
              <div className="form-group">
                <label className="label">Title</label>
                <input placeholder="What needs to be done?" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea placeholder="Add details..." value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={{ minHeight: 72, resize: 'vertical' }} />
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="label">Assign to</label>
                  <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
                <div className="form-group">
                  <label className="label">Due date</label>
                  <input type="date" value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-black" type="submit">Create task</button>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>
          {/* Main content */}
          <div>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0f0f0', padding: 4, borderRadius: 10, width: 'fit-content' }}>
              {['all', ...STATUS_COLS].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                  background: filter === f ? '#fff' : 'transparent',
                  color: filter === f ? '#0d0d0d' : '#888',
                  border: 'none', cursor: 'pointer',
                  boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>
                  {f === 'all' ? `All (${tasks.length})` : `${STATUS_LABELS[f]} (${tasksByStatus[f].length})`}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
                No tasks {filter !== 'all' ? `with status "${STATUS_LABELS[filter]}"` : 'yet'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(task => (
                  <div key={task.id} style={{
                    background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 10,
                    padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Checkbox */}
                      <div
                        onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                        style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                          border: `2px solid ${task.status === 'done' ? '#5a8400' : '#ddd'}`,
                          background: task.status === 'done' ? '#c8f135' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {task.status === 'done' && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L4 7L9 1" stroke="#0d0d0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <p style={{
                            fontWeight: 500, fontSize: 14,
                            textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            color: task.status === 'done' ? '#aaa' : '#0d0d0d',
                          }}>{task.title}</p>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                            <span className={`chip chip-${task.priority}`}>{task.priority}</span>
                            <button className="btn-danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => deleteTask(task.id)}>✕</button>
                          </div>
                        </div>

                        {task.description && (
                          <p style={{ color: '#888', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{task.description}</p>
                        )}

                        <div style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          {task.assigned_to_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: '50%', background: '#f0f0f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 600, color: '#555',
                              }}>
                                {task.assigned_to_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <span style={{ fontSize: 12, color: '#888' }}>{task.assigned_to_name}</span>
                            </div>
                          )}
                          {task.due_date && (
                            <span style={{ fontSize: 12, color: isOverdue(task.due_date, task.status) ? '#ff3b30' : '#888' }}>
                              {isOverdue(task.due_date, task.status) ? '⚠ Overdue · ' : ''}Due {task.due_date}
                            </span>
                          )}
                          <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
                            style={{
                              width: 'auto', fontSize: 12, padding: '4px 8px',
                              background: STATUS_COLORS[task.status],
                              color: STATUS_TEXT[task.status],
                              border: 'none', borderRadius: 6, fontWeight: 500,
                              marginLeft: 'auto',
                            }}>
                            <option value="todo">To do</option>
                            <option value="in-progress">In progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Progress */}
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Progress</h3>
              {STATUS_COLS.map(s => {
                const count = tasks.filter(t => t.status === s).length;
                const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
                return (
                  <div key={s} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: '#555', fontWeight: 500 }}>{STATUS_LABELS[s]}</span>
                      <span style={{ color: '#888' }}>{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: s === 'done' ? '#5a8400' : s === 'in-progress' ? '#1a1aff' : '#ccc',
                      }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#888' }}>
                {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Team */}
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Team</h3>
              {project.members?.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: m.role === 'admin' ? '#0d0d0d' : '#f0f0f0',
                    color: m.role === 'admin' ? '#c8f135' : '#555',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, flexShrink: 0,
                  }}>
                    {m.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                    <p style={{ fontSize: 11, color: '#888' }}>{m.email}</p>
                  </div>
                  <span className={`chip chip-${m.role}`}>{m.role}</span>
                </div>
              ))}

              {isAdmin && (
                <div style={{ marginTop: 12 }}>
                  {!showMemberForm ? (
                    <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
                      onClick={() => setShowMemberForm(true)}>
                      + Add member
                    </button>
                  ) : (
                    <form onSubmit={addMember} style={{ marginTop: 4 }}>
                      <input placeholder="Email address" value={memberEmail}
                        onChange={e => setMemberEmail(e.target.value)} required style={{ marginBottom: 8 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-black btn-sm" type="submit" style={{ flex: 1, justifyContent: 'center' }}>Add</button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowMemberForm(false)}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}