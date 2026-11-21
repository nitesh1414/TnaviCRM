import { useState } from 'react';
import { Upload, Download, Trash2 } from 'lucide-react';
import api, { del } from '../api';
import { Toolbar, Pagination, Modal, Field, Empty, useList, useLookups, fmtDate } from '../components/ui';

export default function Documents() {
  const list = useList('/documents');
  const lookups = useLookups();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Ownership', propertyId: '', brandId: '', notes: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('file', file);
    await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setSaving(false); setModal(false); setForm({ title: '', category: 'Ownership', propertyId: '', brandId: '', notes: '' }); setFile(null); list.reload();
  };
  const remove = async (rec) => { if (confirm('Delete this document record?')) { await del(`/documents/${rec.id}`); list.reload(); } };

  return (
    <div>
      <Toolbar title="Document Management" subtitle="Ownership deeds, floor plans, agreements, NOCs and proposals" onAdd={() => setModal(true)} addLabel="Upload Document" search={list.search} setSearch={list.setSearch}>
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
                <td>{d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noreferrer"><Download size={15} /> {d.fileName || 'View'}</a> : (d.fileName || '—')}</td>
                <td>{fmtDate(d.createdAt)}</td>
                <td><button className="icon-btn danger" onClick={() => remove(d)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.data.length && !list.loading && <Empty />}
        <Pagination page={list.page} total={list.total} onPage={list.setPage} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Upload Document">
        <form onSubmit={save}>
          <div className="form-grid">
            <Field label="Title"><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>
            <Field label="Category"><select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['Ownership','Floor Plan','Agreement','Proposal','Meeting Report','NOC','Photo','Other'].map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Property"><select className="input" value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })}><option value="">None</option>{lookups.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Brand"><select className="input" value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })}><option value="">None</option>{lookups.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
            <Field label="File"><input className="input" type="file" onChange={e => setFile(e.target.files[0])} /></Field>
            <Field label="Notes"><input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" disabled={saving}><Upload size={15} /> {saving ? 'Uploading…' : 'Upload'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
