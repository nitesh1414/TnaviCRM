import { useState } from 'react';
import { post, put, del } from '../api';
import { Toolbar, Pagination, RowActions, Modal, Field, Badge, Empty, useList, useLookups, fmtINR, fmtDate } from '../components/ui';

// Config-driven CRUD page used by Properties, Brands, Leads, Communications, Proposals, Leases, Tasks
export default function GenericCrud({ config }) {
  const { endpoint, title, subtitle, columns, formFields, emptyForm, viewFields } = config;
  const list = useList(endpoint);
  const lookups = useLookups();
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit'|'view', record }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openAdd = () => { setForm({ ...emptyForm }); setModal({ mode: 'add' }); setError(''); };
  const openEdit = (rec) => { setForm({ ...emptyForm, ...rec }); setModal({ mode: 'edit', record: rec }); setError(''); };
  const openView = (rec) => { setModal({ mode: 'view', record: rec }); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (payload.requirements) {
        payload.requirements = { ...payload.requirements };
        for (const field of formFields.filter(f => f.nested && f.csv)) {
          const value = payload.requirements[field.key];
          if (typeof value === 'string') payload.requirements[field.key] = value.split(',').map(x => x.trim()).filter(Boolean);
        }
      }
      if (modal.mode === 'add') await post(endpoint, payload);
      else await put(`${endpoint}/${modal.record.id}`, payload);
      setModal(null); list.reload();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };
  const remove = async (rec) => {
    if (!confirm(`Delete "${rec.title || rec.name || rec.id}"? This cannot be undone.`)) return;
    await del(`${endpoint}/${rec.id}`); list.reload();
  };

  const renderField = (f) => {
    const val = f.nested ? (form.requirements?.[f.key] ?? '') : (form[f.key] ?? '');
    const displayVal = Array.isArray(val) ? val.join(', ') : val;
    const set = (v) => setForm(prev => f.nested ? ({ ...prev, requirements: { ...prev.requirements, [f.key]: v } }) : ({ ...prev, [f.key]: v }));
    if (f.type === 'select') return (
      <Field key={f.key} label={f.label}><select className="input" value={val} onChange={e => set(e.target.value)}>
        <option value="">Select…</option>{f.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select></Field>
    );
    if (f.type === 'lookup') return (
      <Field key={f.key} label={f.label}><select className="input" value={val} onChange={e => set(e.target.value)}>
        <option value="">Select…</option>{f.items(lookups).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select></Field>
    );
    if (f.type === 'textarea') return <Field key={f.key} label={f.label}><textarea className="input" rows="3" value={val} onChange={e => set(e.target.value)} /></Field>;
    return <Field key={f.key} label={f.label}><input className="input" type={f.type || 'text'} value={displayVal} onChange={e => set(e.target.value)} required={f.required} /></Field>;
  };

  const renderValue = (rec, col) => {
    if (col.render) return col.render(rec, lookups);
    const v = rec[col.key];
    if (col.badge) return <Badge value={v} />;
    if (col.money) return fmtINR(v);
    if (col.date) return fmtDate(v);
    if (col.lookup) return col.lookup(rec, lookups);
    return v ?? '—';
  };

  return (
    <div>
      <Toolbar title={title} subtitle={subtitle} onAdd={openAdd} addLabel={config.addLabel || 'Add New'} search={list.search} setSearch={list.setSearch} />
      <div className="table-wrap">
        <table>
          <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}<th>Actions</th></tr></thead>
          <tbody>
            {list.data.map(rec => (
              <tr key={rec.id}>{columns.map(c => <td key={c.key}>{renderValue(rec, c)}</td>)}
                <td><RowActions onView={() => openView(rec)} onEdit={() => openEdit(rec)} onDelete={() => remove(rec)} /></td></tr>
            ))}
          </tbody>
        </table>
        {!list.data.length && !list.loading && <Empty />}
        {list.loading && <p className="muted" style={{ padding: 16 }}>Loading…</p>}
        <Pagination page={list.page} total={list.total} onPage={list.setPage} />
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? `Add ${config.singular}` : modal?.mode === 'edit' ? `Edit ${config.singular}` : config.singular} wide={config.wide}>
        {modal?.mode === 'view' ? (
          <dl className="kv">
            {(viewFields || columns).map(f => (
              <div key={f.key} style={{ display: 'contents' }}>
                <dt>{f.label}</dt><dd>{renderValue(modal.record, f)}</dd>
              </div>
            ))}
            <dt>Created</dt><dd>{fmtDate(modal.record.createdAt)}</dd>
          </dl>
        ) : (
          <form onSubmit={save}>
            {error && <div className="error-box">{error}</div>}
            <div className="form-grid">{formFields.map(renderField)}</div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
