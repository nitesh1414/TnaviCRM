import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, Download, Trash2, Pencil } from 'lucide-react';
import api, { del, put } from '../api';
import { Toolbar, Pagination, Modal, Field, Empty, useList, useLookups, fmtDate } from '../components/ui';

export default function Documents() {
  const { user } = useAuth();
  const list = useList('/documents');
  const lookups = useLookups();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'Ownership', propertyId: '', brandId: '', notes: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('file', file);
    setError('');
    try {
      if (editing) await put(`/documents/${editing.id}`, form);
      else await api.post('/documents/upload', fd);
      setModal(false); setEditing(null); setForm({ title: '', category: 'Ownership', propertyId: '', brandId: '', notes: '' }); setFile(null); list.reload();
    } catch (err) { setError(err.response?.data?.message || 'Upload failed'); }
    finally { setSaving(false); }
  };
  const download = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = doc.fileName || 'document'; link.click(); URL.revokeObjectURL(url);
    } catch { alert('Unable to download document'); }
  };
  const remove = async (rec) => { if (confirm('Delete this document record?')) { await del(`/documents/${rec.id}`); list.reload(); } };

  return (
    <div>
      <Toolbar title="Document Management" subtitle="Ownership deeds, floor plans, agreements, NOCs and proposals" onAdd={user?.role !== 'viewer' ? () => { setEditing(null); setForm({ title:'', category:'Ownership', propertyId:'', brandId:'', notes:'' }); setFile(null); setError(''); setModal(true); } : null} addLabel="Upload Document" search={list.search} setSearch={list.setSearch}>
        <select className="filter-select" value={list.filters.category || ''} onChange={e => list.setFilters({ ...list.filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {['Ownership','Floor Plan','Agreement','Proposal','Meeting Report','NOC','Photo','Other'].map(c => <option key={c}>{c}</option>)}
        </select>
      </Toolbar>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Document</th><th>Category</th><th>Property</th><th>Brand</th><th>File</th><th>Uploaded</th><th>Actions</th></tr></thead>
          <tbody>
            {list.data.map(d => (
              <tr key={d.id}>
                <td><strong>{d.title}</strong><div className="muted">{d.notes}</div></td>
                <td><span className="badge blue">{d.category}</span></td>
                <td>{lookups.propName(d.propertyId)}</td><td>{lookups.brandName(d.brandId)}</td>
                <td>{d.fileUrl ? <button type="button" className="btn-secondary" onClick={() => download(d)}><Download size={15} /> {d.fileName || 'Download'}</button> : (d.fileName || '—')}</td>
                <td>{fmtDate(d.createdAt)}</td>
                <td>{user?.role !== 'viewer' && <button className="icon-btn" title="Edit" onClick={() => { setEditing(d); setForm({ title:d.title || '', category:d.category || 'Other', propertyId:d.propertyId || '', brandId:d.brandId || '', notes:d.notes || '' }); setError(''); setModal(true); }}><Pencil size={15} /></button>}{['admin', 'manager'].includes(user?.role) && <button className="icon-btn danger" onClick={() => remove(d)}><Trash2 size={15} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.data.length && !list.loading && <Empty />}
        <Pagination page={list.page} total={list.total} onPage={list.setPage} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Document' : 'Upload Document'}>
        <form onSubmit={save}>
          {error && <div className="error-box">{error}</div>}
          <div className="form-grid">
            <Field label="Title"><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>
            <Field label="Category"><select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['Ownership','Floor Plan','Agreement','Proposal','Meeting Report','NOC','Photo','Other'].map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Property"><select className="input" value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })}><option value="">None</option>{lookups.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Brand"><select className="input" value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })}><option value="">None</option>{lookups.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
            {!editing && <Field label="File"><input className="input" type="file" onChange={e => setFile(e.target.files[0])} required /></Field>}
            <Field label="Notes"><input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" disabled={saving}><Upload size={15} /> {saving ? 'Saving…' : editing ? 'Save changes' : 'Upload'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
