import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api, { get } from '../api';
import { BarChart, Donut, Badge, fmtINR } from '../components/ui';

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { get('/reports/all').then(r => setData(r.data)).catch(() => setError('Could not load reports')); }, []);
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <p className="muted">Loading reports…</p>;

  const exportCsv = async (type) => {
    try {
      const response = await api.get(`/reports/export/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = `${type}.csv`; link.click(); URL.revokeObjectURL(url);
    } catch { setError('Export failed. There may be no records to export.'); }
  };

  return (
    <div>
      <div className="page-head"><div><h1>Reports & Analytics</h1><p className="muted">Availability, interest, performance and expiry insights</p></div>
        <div className="page-actions">
          {['properties','brands','leads','meetings','proposals','leases','tasks'].map(t => (
            <button key={t} className="btn-secondary" onClick={() => exportCsv(t)}><Download size={14} /> {t}</button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card"><h3>Property Availability</h3><Donut data={data.propertyAvailability} /></div>
        <div className="card"><h3>Negotiation Status</h3><BarChart data={data.negotiationStatus} color="#8b5cf6" /></div>
      </div>
      <div className="grid-2">
        <div className="card"><h3>Brand-wise Enquiries</h3><BarChart data={data.brandWiseEnquiries} color="#f59e0b" /></div>
        <div className="card"><h3>Property-wise Brand Interest</h3><BarChart data={data.propertyWiseInterest} color="#22c55e" /></div>
      </div>
      <div className="grid-2">
        <div className="card"><h3>Communication by Type</h3><BarChart data={data.communicationByType} color="#3b82f6" /></div>
        <div className="card"><h3>Vacant vs Leased</h3><p>Vacant: <strong>{data.vacantProperties.length}</strong> · Leased: <strong>{data.leasedProperties.length}</strong></p>
          {data.vacantProperties.map(p => <div key={p.id} className="list-item"><span>{p.name} — {p.city}</span><span className="muted">{fmtINR(p.expectedRent)}/mo</span></div>)}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Employee Performance</h3>
        <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
          <table><thead><tr><th>Employee</th><th>Role</th><th>Leads</th><th>Tasks</th><th>Completed</th><th>Meetings</th><th>Communications</th><th>Proposals</th></tr></thead>
          <tbody>{data.employeePerformance.map((e, i) => <tr key={i}><td><strong>{e.name}</strong></td><td>{e.role}</td><td>{e.leads}</td><td>{e.tasks}</td><td>{e.completedTasks}</td><td>{e.meetings}</td><td>{e.communications}</td><td>{e.proposals}</td></tr>)}</tbody></table>
        </div>
      </div>

      <div className="grid-2">
        <div className="card"><h3>Active Proposals ({data.activeProposals.length})</h3>
          {data.activeProposals.map(p => <div key={p.id} className="list-item"><div><strong>{p.title}</strong><div className="muted">{p.brandName} · {p.propertyName} · {fmtINR(p.proposedRent)}/mo</div></div><Badge value={p.stage} /></div>)}
          {!data.activeProposals.length && <p className="muted">None</p>}
        </div>
        <div className="card"><h3>Lease Expiry / Renewal ({data.leaseExpiry.length})</h3>
          {data.leaseExpiry.map(l => <div key={l.id} className="list-item"><div><strong>{l.propertyName}</strong><div className="muted">{l.brandName} · expires {l.expiryDate}</div></div><Badge value="Active" /></div>)}
          {!data.leaseExpiry.length && <p className="muted">No leases expiring in next 90 days</p>}
        </div>
      </div>
      <div className="grid-2">
        <div className="card"><h3>Follow-up Pending ({data.followUpPending.length})</h3>
          {data.followUpPending.map(l => <div key={l.id} className="list-item"><div><strong>{l.title}</strong><div className="muted">{l.brandName} · due {l.followUpDate}</div></div><Badge value={l.status} /></div>)}
        </div>
        <div className="card"><h3>Overdue Tasks ({data.overdueTasks.length})</h3>
          {data.overdueTasks.map(t => <div key={t.id} className="list-item"><div><strong>{t.title}</strong><div className="muted">{t.assignee} · due {t.dueDate}</div></div><Badge value={t.priority} /></div>)}
          {!data.overdueTasks.length && <p className="muted">No overdue tasks</p>}
        </div>
      </div>
    </div>
  );
}
