import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { get, post, put, del } from '../api';
import { Toolbar, Pagination, RowActions, Modal, Field, Badge, Empty, useList, useLookups, fmtDate } from '../components/ui';

const localDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const emptyForm = { title: '', brandId: '', propertyId: '', date: new Date().toISOString().slice(0,10), time: '', venue: '', purpose: '', participants: '', responsible: '', agenda: '', minutes: '', status: 'Scheduled', type: 'Meeting' };

export default function Meetings() {
  const { user } = useAuth();
  const list = useList('/meetings');
  const lookups = useLookups();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState('list'); // list | calendar
  const [calMonth, setCalMonth] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState('month');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarError, setCalendarError] = useState('');
  const [calendarVersion, setCalendarVersion] = useState(0);
  useEffect(() => {
    if (view !== 'calendar') return;
    let cancelled = false;
    async function load() {
      try {
        let page = 1, result, items = [];
        do { result = await get('/meetings', { page, limit: 100, search: list.search }); items.push(...result.data); page++; } while (page <= result.pages);
        if (!cancelled) { setCalendarEvents(items); setCalendarError(''); }
      } catch { if (!cancelled) setCalendarError('Could not load all calendar events.'); }
    }
    load(); return () => { cancelled = true; };
  }, [view, list.search, calendarVersion]);

  const openAdd = () => { setForm({ ...emptyForm }); setModal({ mode: 'add' }); };
  const openEdit = (rec) => { setForm({ ...emptyForm, ...rec, participants: Array.isArray(rec.participants) ? rec.participants.join(', ') : (rec.participants || '') }); setModal({ mode: 'edit', record: rec }); };
  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, participants: form.participants ? form.participants.split(',').map(s => s.trim()).filter(Boolean) : [] };
    if (modal.mode === 'add') await post('/meetings', payload); else await put(`/meetings/${modal.record.id}`, payload);
    setModal(null); list.reload(); setCalendarVersion(v => v + 1);
  };
  const remove = async (rec) => { if (confirm('Delete this meeting?')) { await del(`/meetings/${rec.id}`); list.reload(); setCalendarVersion(v => v + 1); } };

  const calDays = useMemo(() => {
    const year = calMonth.getFullYear(), month = calMonth.getMonth();
    if (calendarMode === 'day') return [new Date(year, month, calMonth.getDate())];
    if (calendarMode === 'week') { const first = new Date(year, month, calMonth.getDate() - calMonth.getDay()); return Array.from({ length: 7 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i)); }
    const first = new Date(year, month, 1);
    const cells = Array(first.getDay()).fill(null);
    for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calMonth, calendarMode]);
  const moveCalendar = delta => setCalMonth(current => calendarMode === 'month' ? new Date(current.getFullYear(), current.getMonth() + delta, 1) : new Date(current.getFullYear(), current.getMonth(), current.getDate() + delta * (calendarMode === 'week' ? 7 : 1)));

  const eventsOn = (date) => {
    if (!date) return [];
    const iso = localDate(date);
    return calendarEvents.filter(m => m.date === iso);
  };

  return (
    <div>
      <Toolbar title="Meetings & Site Visits" subtitle="Schedule, track minutes and follow-ups with calendar view" onAdd={user?.role !== 'viewer' ? openAdd : null} addLabel="Schedule Meeting" search={list.search} setSearch={list.setSearch}>
        <button className={`btn-secondary ${view === 'list' ? 'btn-primary' : ''}`} onClick={() => setView('list')}>List</button>
        <button className={`btn-secondary ${view === 'calendar' ? 'btn-primary' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
      </Toolbar>

      {view === 'calendar' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button className="btn-secondary" onClick={() => moveCalendar(-1)}>← Prev</button>
            <h3>{calendarMode === 'month' ? calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : calendarMode === 'week' ? `Week of ${calDays[0].toLocaleDateString('en-IN')}` : calMonth.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            <button className="btn-secondary" onClick={() => moveCalendar(1)}>Next →</button>
          </div>
          <div className="page-actions" style={{ marginBottom: 12 }}>{['day','week','month'].map(mode => <button key={mode} type="button" className={calendarMode === mode ? 'btn-primary' : 'btn-secondary'} onClick={() => setCalendarMode(mode)}>{mode[0].toUpperCase() + mode.slice(1)}</button>)}</div>
          {calendarError && <div className="error-box">{calendarError}</div>}
          <div className="calendar-grid" style={calendarMode === 'day' ? { gridTemplateColumns: '1fr' } : undefined}>
            {(calendarMode === 'day' ? [calMonth.toLocaleDateString('en-IN', { weekday: 'short' })] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map(d => <div key={d} style={{ fontWeight: 700, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>{d}</div>)}
            {calDays.map((d, i) => (
              <div key={i} className={`cal-day ${d && localDate(d) === localDate(new Date()) ? 'today' : ''}`}>
                {d && <><div className="cal-num">{d.getDate()}</div>{eventsOn(d).map(m => <div key={m.id} className="cal-event" title={m.title}>{m.time} {m.title}</div>)}</>}
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 10 }}>Calendar dates use your local timezone.</p>
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
                  <td><RowActions onView={() => setModal({ mode: 'view', record: m })} onEdit={user?.role !== 'viewer' ? () => openEdit(m) : null} onDelete={['admin','manager'].includes(user?.role) ? () => remove(m) : null} /></td>
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
