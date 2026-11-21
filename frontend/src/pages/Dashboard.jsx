import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Store, FileText, CalendarDays, CheckSquare, KeyRound, MessagesSquare, UserPlus, AlertTriangle, Clock } from 'lucide-react';
import { get } from '../api';
import { StatCard, BarChart, Donut, Badge, fmtINR, fmtDate } from '../components/ui';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { get('/dashboard').then(r => setData(r.data)).catch(() => setError('Could not load dashboard. Is the backend running?')); }, []);
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <p className="muted">Loading dashboard…</p>;
  const s = data.stats;

  return (
    <div>
      <div className="page-head"><div><h1>Dashboard</h1><p className="muted">Property leasing overview at a glance</p></div></div>

      <div className="grid-stats">
        <StatCard icon={Building2} label="Total Properties" value={s.totalProperties} sub={`${s.availableProperties} available · ${s.leasedProperties} leased`} color="#eef2ff" />
        <StatCard icon={Store} label="Total Brands" value={s.totalBrands} sub="Corporate clients" color="#fef3c7" />
        <StatCard icon={FileText} label="Active Proposals" value={s.activeProposals} sub="Under negotiation" color="#dcfce7" />
        <StatCard icon={CalendarDays} label="Upcoming Meetings" value={s.upcomingMeetings} sub="Scheduled ahead" color="#dbeafe" />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={s.pendingTasks} sub={`${s.overdueTasks} overdue`} color="#fee2e2" />
        <StatCard icon={KeyRound} label="Active Leases" value={s.activeLeases} sub={`${fmtINR(data.monthlyRentRoll)}/month rent roll`} color="#ccfbf1" />
        <StatCard icon={MessagesSquare} label="Communications" value={s.totalCommunications} sub="Calls · Email · WhatsApp" color="#f3e8ff" />
        <StatCard icon={UserPlus} label="Active Enquiries" value={s.activeLeads} sub={`${s.pendingFollowUps} follow-ups due`} color="#ffedd5" />
      </div>

      <div className="grid-2">
        <div className="card"><h3>Properties by Status</h3><Donut data={data.byPropertyStatus} /></div>
        <div className="card"><h3>Enquiry Pipeline</h3><BarChart data={data.byLeadStatus} color="#8b5cf6" /></div>
      </div>
      <div className="grid-2">
        <div className="card"><h3>Properties by Type</h3><BarChart data={data.byPropertyType} color="#22c55e" /></div>
        <div className="card"><h3>Brands by Category</h3><BarChart data={data.byBrandCategory} color="#f59e0b" /></div>
      </div>

      <div className="grid-3">
        <div className="card">
          <h3>Upcoming Meetings</h3>
          {data.upcomingMeetingsList.map(m => (
            <div key={m.id} className="list-item"><div><strong>{m.title}</strong><div className="muted">{fmtDate(m.date)} · {m.time} · {m.venue}</div></div><Badge value={m.status} /></div>
          ))}
          {!data.upcomingMeetingsList.length && <p className="muted">No upcoming meetings</p>}
          <Link to="/meetings" className="muted">View all →</Link>
        </div>
        <div className="card">
          <h3>Pending Tasks</h3>
          {data.pendingTasksList.map(t => (
            <div key={t.id} className="list-item"><div><strong>{t.title}</strong><div className="muted">Due {fmtDate(t.dueDate)}</div></div><Badge value={t.priority} /></div>
          ))}
          {!data.pendingTasksList.length && <p className="muted">No pending tasks</p>}
          <Link to="/tasks" className="muted">View all →</Link>
        </div>
        <div className="card">
          <h3>Recent Activity</h3>
          {data.recentActivity.map(a => (
            <div key={a.id} className="list-item"><div><strong>{a.userName}</strong> {a.action} {a.entity}<div className="muted">{fmtDate(a.createdAt)}</div></div></div>
          ))}
          {!data.recentActivity.length && <p className="muted">No activity yet</p>}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Recently Added Properties</h3>
          {data.recentProperties.map(p => (
            <div key={p.id} className="list-item"><div><strong>{p.name}</strong><div className="muted">{p.city} · {p.type} · {fmtINR(p.expectedRent)}/mo</div></div><Badge value={p.status} /></div>
          ))}
        </div>
        <div className="card">
          <h3>Recent Enquiries</h3>
          {data.recentLeads.map(l => (
            <div key={l.id} className="list-item"><div><strong>{l.title}</strong><div className="muted">Follow-up {fmtDate(l.followUpDate)}</div></div><Badge value={l.status} /></div>
          ))}
        </div>
      </div>

      {(s.overdueTasks > 0 || s.expiringLeases > 0) && (
        <div className="card" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
          <h3 style={{ color: '#991b1b' }}><AlertTriangle size={16} style={{ verticalAlign: 'middle' }} /> Attention Needed</h3>
          <p style={{ margin: '6px 0' }}>{s.overdueTasks > 0 && <span><Clock size={14} /> {s.overdueTasks} overdue task(s). </span>}{s.expiringLeases > 0 && <span>{s.expiringLeases} lease(s) expiring within 7 days.</span>}</p>
        </div>
      )}
    </div>
  );
}
