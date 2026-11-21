import { useEffect, useState } from 'react';
import { post, put, del, get } from '../api';
import { useAuth } from '../context/AuthContext';
import { Toolbar, Modal, Field, Badge, Empty, fmtDate } from '../components/ui';

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', phone: '', designation: '' });
  const [error, setError] = useState('');

  const load = () => { get('/users').then(r => setUsers(r.data || [])).catch(() => {}); get('/users/activity').then(r => setLogs(r.data || [])).catch(() => {}); };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (modal.mode === 'add') await post('/users', form);
      else { const { email, ...rest } = form; await put(`/users/${modal.record.id}`, rest); }
      setModal(null); load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
  };
  const remove = async (u) => { if (confirm(`Delete ${u.name}?`)) { await del(`/users/${u.id}`); load(); } };

  return (
    <div>
      <Toolbar title="Users & Employees" subtitle="Role-based access, assignments and activity logs" onAdd={isAdmin ? () => { setForm({ name: '', email: '', password: '', role: 'employee', phone: '', designation: '' }); setModal({ mode: 'add' }); } : null} addLabel="Add Employee" search="" setSearch={() => {}} />
      {!isAdmin && <div className="success-box">You are viewing as {user?.role}. Only admins can add/edit users.</div>}

      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table><thead><tr><th>Employee</th><th>Email</th><th>Role</th><th>Phone</th><th>Designation</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{users.map(u => (
          <tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td><Badge value={u.role} /></td><td>{u.phone || '—'}</td><td>{u.designation || '—'}</td>
          <td>{u.active === false ? <Badge value="Rejected" /> : <Badge value="Active" />}</td>
          <td>{isAdmin && <div className="row-actions"><button className="btn-secondary" onClick={() => { setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', designation: u.designation || '' }); setModal({ mode: 'edit', record: u }); }}>Edit</button><button className="btn-secondary" onClick={() => remove(u)}>Delete</button></div>}</td></tr>
        ))}</tbody></table>
        {!users.length && <Empty />}
      </div>

      <div className="card">
        <h3>User Activity Log</h3>
        {logs.slice(0, 20).map(l => <div key={l.id} className="list-item"><div><strong>{l.userName}</strong> {l.action} {l.entity}<div className="muted">{l.details}</div></div><span className="muted">{fmtDate(l.createdAt)}</span></div>)}
        {!logs.length && <p className="muted">No activity yet</p>}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Add Employee' : 'Edit Employee'}>
        <form onSubmit={save}>
          {error && <div className="error-box">{error}</div>}
          <div className="form-grid">
            <Field label="Name"><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={modal?.mode === 'edit'} required /></Field>
            <Field label="Password"><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal?.mode === 'add'} placeholder={modal?.mode === 'edit' ? 'Leave blank to keep' : ''} /></Field>
            <Field label="Role"><select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{['admin','manager','employee','viewer'].map(r => <option key={r}>{r}</option>)}</select></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Designation"><input className="input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} /></Field>
          </div>
          <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
