import { useEffect, useState } from 'react';
import { X, Search, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { get } from '../api';

export const fmtINR = (n) => n == null || n === '' ? '—' : '₹' + Number(n).toLocaleString('en-IN');
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function Badge({ value }) {
  const map = {
    'Available': 'green', 'Leased': 'blue', 'Under Negotiation': 'amber',
    'New': 'gray', 'Contacted': 'blue', 'Interested': 'teal', 'Negotiation': 'amber', 'Approved': 'green', 'Rejected': 'red',
    'Scheduled': 'blue', 'Completed': 'green', 'Cancelled': 'red', 'Active': 'green', 'Draft': 'gray', 'Sent': 'blue',
    'Pending': 'amber', 'In Progress': 'blue', 'High': 'red', 'Medium': 'amber', 'Low': 'gray',
    'admin': 'red', 'manager': 'amber', 'employee': 'blue', 'viewer': 'gray',
  };
  return <span className={`badge ${map[value] || 'gray'}`}>{value || '—'}</span>;
}

export function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color || '#eef2ff', color: '#4f46e5' }}><Icon size={22} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function BarChart({ data, color = '#4f46e5' }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="chart">
      {data.map((d, i) => (
        <div key={i} className="chart-row">
          <span className="chart-label">{d.name}</span>
          <div className="chart-track"><div className="chart-bar" style={{ width: `${(d.value / max) * 100}%`, background: color }} /></div>
          <span className="chart-val">{d.value}</span>
        </div>
      ))}
      {!data.length && <p className="muted">No data</p>}
    </div>
  );
}

export function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const divisor = total || 1;
  const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
  let acc = 0;
  const segments = data.filter(d => d.value > 0).map((d, i) => {
    const start = (acc / divisor) * 360; acc += d.value;
    const end = (acc / divisor) * 360;
    return { ...d, start, end, color: colors[i % colors.length] };
  });
  const polar = (angle, r) => { const rad = (angle - 90) * Math.PI / 180; return [50 + r * Math.cos(rad), 50 + r * Math.sin(rad)]; };
  const arc = (s) => {
    const [x1, y1] = polar(s.start, 38), [x2, y2] = polar(s.end, 38);
    const large = (s.end - s.start) > 180 ? 1 : 0;
    return `M 50 50 L ${x1} ${y1} A 38 38 0 ${large} 1 ${x2} ${y2} Z`;
  };
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 100 100" className="donut">
        {segments.length === 1 ? <circle cx="50" cy="50" r="38" fill={segments[0].color} /> : segments.map((s, i) => <path key={i} d={arc(s)} fill={s.color} stroke="#fff" strokeWidth="1" />)}
        <circle cx="50" cy="50" r="22" fill="#fff" />
        <text x="50" y="48" textAnchor="middle" fontSize="11" fontWeight="700" fill="#111827">{total}</text>
        <text x="50" y="58" textAnchor="middle" fontSize="5" fill="#6b7280">TOTAL</text>
      </svg>
      <div className="donut-legend">
        {segments.map((s, i) => <div key={i} className="legend-item"><span style={{ background: s.color }} />{s.name} — {s.value}</div>)}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
export const inputCls = 'input';

export function useList(endpoint, extraParams = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(extraParams);

  const load = async () => {
    setLoading(true);
    try {
      const res = await get(endpoint, { search, page, limit: 20, ...filters });
      if (res.data) { setData(res.data); setTotal(res.total || res.data.length); }
      else if (Array.isArray(res)) { setData(res); setTotal(res.length); }
    } catch { /* keep old */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, [search, page, JSON.stringify(filters)]);
  return { data, total, loading, search, setSearch, page, setPage, filters, setFilters, reload: load };
}

export function Toolbar({ title, subtitle, onAdd, addLabel = 'Add New', search, setSearch, children }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>
      <div className="page-actions">
        {children}
        <div className="search-box"><Search size={16} /><input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {onAdd && <button className="btn-primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>}
      </div>
    </div>
  );
}

export function Pagination({ page, total, limit = 20, onPage }) {
  const pages = Math.ceil(total / limit) || 1;
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
      <span>Page {page} of {pages} ({total} records)</span>
      <button disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

export function RowActions({ onView, onEdit, onDelete }) {
  return (
    <div className="row-actions">
      {onView && <button className="icon-btn" title="View" onClick={onView}><Eye size={15} /></button>}
      {onEdit && <button className="icon-btn" title="Edit" onClick={onEdit}><Pencil size={15} /></button>}
      {onDelete && <button className="icon-btn danger" title="Delete" onClick={onDelete}><Trash2 size={15} /></button>}
    </div>
  );
}

export function Empty({ msg = 'No records found' }) {
  return <div className="empty">{msg}</div>;
}

export function useLookups() {
  const [properties, setProperties] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    get('/properties', { limit: 100 }).then(r => setProperties(r.data || [])).catch(() => {});
    get('/brands', { limit: 100 }).then(r => setBrands(r.data || [])).catch(() => {});
    get('/users').then(r => setUsers(r.data || [])).catch(() => {});
  }, []);
  const propName = (id) => (properties.find(p => String(p.id) === String(id)) || {}).name || '—';
  const brandName = (id) => (brands.find(b => String(b.id) === String(id)) || {}).name || '—';
  const userName = (id) => (users.find(u => String(u.id) === String(id)) || {}).name || 'Unassigned';
  return { properties, brands, users, propName, brandName, userName };
}
