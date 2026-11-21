import { useMemo, useState } from 'react';
import { post, put, del } from '../api';
import { Toolbar, Pagination, RowActions, Modal, Field, Badge, Empty, useList, useLookups, fmtDate } from '../components/ui';

const emptyForm = { title: '', brandId: '', propertyId: '', date: new Date().toISOString().slice(0,10), time: '', venue: '', purpose: '', participants: '', responsible: '', agenda: '', minutes: '', status: 'Scheduled', type: 'Meeting' };

export default function Meetings() {
  const list = useList('/meetings');
  const lookups = useLookups();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState('list'); // list | calendar
  const [calMonth, setCalMonth] = useState(new Date());

  const openAdd = () => { setForm({ ...emptyForm }); setModal({ mode: 'add' }); };
  const openEdit = (rec) => { setForm({ ...emptyForm, ...rec, participants: Array.isArray(rec.participants) ? rec.participants.join(', ') : (rec.participants || '') }); setModal({ mode: 'edit', record: rec }); };
  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, participants: form.participants ? form.participants.split(',').map(s => s.trim()).filter(Boolean) : [] };
    if (modal.mode === 'add') await post('/meetings', payload); else await put(`/meetings/${modal.record.id}`, payload);
    setModal(null); list.reload();
  };
  const remove = async (rec) => { if (confirm('Delete this meeting?')) { await del(`/meetings/${rec.id}`); list.reload(); } };

  const calDays = useMemo(() => {
    const year = calMonth.getFullYear(), month = calMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calMonth]);

  const eventsOn = (date) => {
    if (!date) return [];
    const iso = date.toISOString().slice(0, 10);
    return list.data.filter(m => m.date === iso);
  };

  return (
    <div>
      <Toolbar title="Meetings & Site Visits" subtitle="Schedule, track minutes and follow-ups with calendar view" onAdd={openAdd} addLabel="Schedule Meeting" search={list.search} setSearch={list.setSearch}>
        <button className={`btn-secondary ${view === 'list' ? 'btn-primary' : ''}`} onClick={() => setView('list')}>List</button>
        <button className={`btn-secondary ${view === 'calendar' ? 'btn-primary' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
      </Toolbar>

      {view === 'calendar' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button className="btn-secondary" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>← Prev</button>
            <h3>{calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
            <button className="btn-secondary" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>Next →</button>
          </div>
          <div className="calendar-grid">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ fontWeight: 700, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>{d}</div>)}
            {calDays.map((d, i) => (
              <div key={i} className={`cal-day ${d && d.toISOString().slice(0,10) === new Date().toISOString().slice(0,10) ? 'today' : ''}`}>
                {d && <><div className="cal-num">{d.getDate()}</div>{eventsOn(d).map(m => <div key={m.id} className="cal-event" title={m.title}>{m.time} {m.title}</div>)}</>}
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 10 }}>Showing events from current page of results. Switch to List view for full records.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Meeting</th><th>Brand</th><th>Property</th><th>Date</th><th>Time</th><th>Venue</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.data.map(m => (
                <tr key={m.id}>
                  <td><strong>{m.title}</strong><div className="muted">{m.purpose}</div></td>
                  <td>{lookups.brandName(m.brandId)}</td><td>{lookups.propName(m.propertyId)}</td>
                  <td>{fmtDate(m.date)}</td><td>{m.time || '—'}</td><td>{m.venue || '—'}</td>
                  <td>{m.type}</td><td><Badge value={m.status} /></td>
                  <td><RowActions onView={() => setModal({ mode: 'view', record: m })} onEdit={() => openEdit(m)} onDelete={() => remove(m)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.data.length && !list.loading && <Empty />}
          <Pagination page={list.page} total={list.total} onPage={list.setPage} />
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Schedule Meeting' : modal?.mode === 'edit' ? 'Edit Meeting' : 'Meeting Details'} wide>
        {modal?.mode === 'view' ? (
          <dl className="kv">
            <dt>Title</dt><dd>{modal.record.title}</dd><dt>Date</dt><dd>{fmtDate(modal.record.date)} {modal.record.time}</dd>
            <dt>Venue</dt><dd>{modal.record.venue}</dd><dt>Purpose</dt><dd>{modal.record.purpose}</dd>
            <dt>Participants</dt><dd>{(modal.record.participants || []).join(', ')}</dd>
            <dt>Agenda</dt><dd>{modal.record.agenda}</dd><dt>Minutes</dt><dd>{modal.record.minutes || '—'}</dd>
            <dt>Status</dt><dd><Badge value={modal.record.status} /></dd>
          </dl>
        ) : (
          <form onSubmit={save}>
            <div className="form-grid">
              <Field label="Title"><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>
              <Field label="Type"><select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{['Meeting','Site Visit','Call','Negotiation'].map(t => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Brand"><select className="input" value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })}><option value="">Select…</option>{lookups.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
              <Field label="Property"><select className="input" value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })}><option value="">Select…</option>{lookups.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
              <Field label="Date"><input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label="Time"><input className="input" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></Field>
              <Field label="Venue"><input className="input" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></Field>
              <Field label="Purpose"><input className="input" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></Field>
              <Field label="Participants (comma separated)"><input className="input" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} /></Field>
              <Field label="Responsible"><select className="input" value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })}><option value="">Select…</option>{lookups.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
              <Field label="Status"><select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['Scheduled','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Agenda"><textarea className="input" rows="2" value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} /></Field>
              <Field label="Minutes / Decisions"><textarea className="input" rows="2" value={form.minutes} onChange={e => setForm({ ...form, minutes: e.target.value })} /></Field>
            </div>
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary">Save</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
