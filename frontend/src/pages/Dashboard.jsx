import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/tasks/stats/dashboard'),
          api.get('/tasks/my')
        ]);
        setStats(statsRes.data);
        setMyTasks(tasksRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      // Refresh stats
      const statsRes = await api.get('/tasks/stats/dashboard');
      setStats(statsRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  const isOverdue = (due_date, status) => {
    if (!due_date || status === 'done') return false;
    return new Date(due_date) < new Date();
  };

  if (loading) return <><Navbar /><div className="spinner" /></>;

  const statCards = [
    { label: 'My Projects', value: stats?.totalProjects || 0, color: 'var(--accent2)' },
    { label: 'Total Tasks', value: stats?.totalTasks || 0, color: 'var(--text)' },
    { label: 'In Progress', value: stats?.inProgressTasks || 0, color: 'var(--accent2)' },
    { label: 'Completed', value: stats?.doneTasks || 0, color: 'var(--accent)' },
    { label: 'Overdue', value: stats?.overdueTasks || 0, color: 'var(--danger)' },
  ];

  return (
    <>
      <Navbar />
      <div className="page">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800 }}>
            Hey, {user.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>Here's what's on your plate</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {statCards.map(s => (
            <div key={s.label} className="card" style={{ flex: '1', minWidth: '140px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: s.color, fontFamily: 'var(--font-heading)' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* My Tasks */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          Assigned To Me
        </h2>

        {myTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px' }}>
            No tasks assigned to you yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myTasks.map(task => (
              <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{task.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    📁 {task.project_name}
                    {task.due_date && (
                      <span className={isOverdue(task.due_date, task.status) ? 'overdue' : ''} style={{ marginLeft: '12px' }}>
                        📅 {task.due_date} {isOverdue(task.due_date, task.status) && '(overdue)'}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                <select
                  value={task.status}
                  onChange={e => updateStatus(task.id, e.target.value)}
                  style={{ width: 'auto', fontSize: '12px', padding: '6px 10px' }}
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <span className={`badge badge-${task.status}`}>{task.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}