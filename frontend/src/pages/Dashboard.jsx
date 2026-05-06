import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    Promise.all([api.get('/tasks/stats/dashboard'), api.get('/tasks/my')])
      .then(([s, t]) => { setStats(s.data); setMyTasks(t.data); })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}/status`, { status });
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    const s = await api.get('/tasks/stats/dashboard');
    setStats(s.data);
  };

  const isOverdue = (due, status) => due && status !== 'done' && new Date(due) < new Date();

  if (loading) return <><Navbar /><div className="spin" /></>;

  const statItems = [
  { label: 'Projects', value: stats?.totalProjects ?? 0, accent: false },
  { label: 'Total tasks', value: stats?.totalTasks ?? 0, accent: false },
  { label: 'In progress', value: stats?.inProgressTasks ?? 0, accent: false },
  { label: 'Completed', value: stats?.doneTasks ?? 0, accent: true },
  { label: 'Overdue', value: stats?.overdueTasks ?? 0, danger: true },
];

  return (
    <>
      <Navbar />
      <div className="page">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: '#888', fontSize: 13, fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.6px' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name?.split(' ')[0]}
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 48 }}>
          {statItems.map(({ label, value, accent, danger }) => (
            <div key={label} style={{
              background: accent ? '#0d0d0d' : '#fff',
              border: `1.5px solid ${danger && value > 0 ? '#ffd5d2' : '#e8e8e8'}`,
              borderRadius: 12, padding: '20px 20px',
            }}>
              <p style={{ fontSize: 28, fontWeight: 600, color: danger && value > 0 ? '#ff3b30' : accent ? '#c8f135' : '#0d0d0d', letterSpacing: '-0.5px' }}>
                {value}
              </p>
              <p style={{ fontSize: 12, color: accent ? '#888' : '#888', marginTop: 4, fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tasks list */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>My assigned tasks</h2>
          <span style={{ fontSize: 13, color: '#888' }}>{myTasks.length} task{myTasks.length !== 1 ? 's' : ''}</span>
        </div>

        {myTasks.length === 0 ? (
          <div style={{
            background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 12,
            padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>All clear</p>
            <p style={{ color: '#888', fontSize: 14 }}>No tasks assigned to you yet.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
            {myTasks.map((task, i) => (
              <div key={task.id} style={{
                padding: '16px 20px',
                borderBottom: i < myTasks.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', border: `2px solid ${task.status === 'done' ? '#5a8400' : '#ddd'}`,
                  background: task.status === 'done' ? '#c8f135' : 'transparent', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }} onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}>
                  {task.status === 'done' && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L4 7L9 1" stroke="#0d0d0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 500, fontSize: 14, marginBottom: 2,
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    color: task.status === 'done' ? '#aaa' : '#0d0d0d',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{task.title}</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#888' }}>📁 {task.project_name}</span>
                    {task.due_date && (
                      <span style={{ fontSize: 12, color: isOverdue(task.due_date, task.status) ? '#ff3b30' : '#888' }}>
                        {isOverdue(task.due_date, task.status) ? '⚠ ' : ''}Due {task.due_date}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span className={`chip chip-${task.priority}`}>{task.priority}</span>
                  <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
                    style={{ width: 'auto', fontSize: 12, padding: '5px 10px', borderRadius: 8 }}>
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}