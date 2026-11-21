import { useEffect, useState } from 'react';
import { Bell, CalendarDays, CheckSquare, KeyRound, UserPlus, CheckCheck } from 'lucide-react';
import { get, patch, del } from '../api';
import { fmtDate } from '../components/ui';

const iconFor = (type) => {
  if (type === 'meeting') return <CalendarDays size={18} />;
  if (type === 'task') return <CheckSquare size={18} />;
  if (type === 'lease') return <KeyRound size={18} />;
  if (type === 'followup') return <UserPlus size={18} />;
  return <Bell size={18} />;
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [smart, setSmart] = useState([]);
  const load = () => { get('/notifications').then(r => setItems(r.data || [])).catch(() => {}); get('/notifications/smart').then(r => setSmart(r.data || [])).catch(() => {}); };
  useEffect(load, []);

  const markRead = async (id) => { await patch(`/notifications/${id}/read`); load(); };
  const markAll = async () => { await patch('/notifications/read-all'); load(); };
  const remove = async (id) => { await del(`/notifications/${id}`); load(); };

  return (
    <div>
      <div className="page-head"><div><h1>Notifications & Reminders</h1><p className="muted">Meetings, follow-ups, task deadlines and lease expiry alerts</p></div>
        <button className="btn-secondary" onClick={markAll}><CheckCheck size={15} /> Mark all read</button></div>

      <div className="grid-2">
        <div className="card">
          <h3>Smart Reminders (live from data)</h3>
          {smart.map((s, i) => (
            <div key={i} className="list-item"><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ color: '#4f46e5' }}>{iconFor(s.type)}</span><div><strong>{s.title}</strong><div className="muted">{s.message}</div></div></div><span className="muted">{fmtDate(s.date)}</span></div>
          ))}
          {!smart.length && <p className="muted">No upcoming reminders in the next 7 days</p>}
        </div>
        <div className="card">
          <h3>In-App Notifications ({items.filter(n => !n.read).length} unread)</h3>
          {items.map(n => (
            <div key={n.id} className="list-item" style={{ opacity: n.read ? .6 : 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ color: '#4f46e5' }}>{iconFor(n.type)}</span><div><strong>{n.title}</strong><div className="muted">{n.message}</div><div className="muted">{fmtDate(n.createdAt)}</div></div></div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!n.read && <button className="btn-secondary" onClick={() => markRead(n.id)}>Read</button>}
                <button className="btn-secondary" onClick={() => remove(n.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="muted">No notifications</p>}
        </div>
      </div>
      <div className="card"><h3>Integrations</h3><p className="muted">Reminders are calculated when this page is opened. Automatic delivery, email and WhatsApp integrations are not implemented.</p></div>
    </div>
  );
}
