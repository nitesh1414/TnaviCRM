import { useEffect, useState } from 'react';
import { get, post } from '../api';
import { Field, useLookups } from '../components/ui';

export default function Compose() {
  const { properties, brands } = useLookups();
  const [company, setCompany] = useState({});
  const [templates, setTemplates] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ channel: 'email', brandId: '', propertyId: '', meetingId: '', to: '', subject: '', body: '', documentIds: [], mode: 'text', templateName: '', language: 'en_US', parameters: '' });
  const [scheduled, setScheduled] = useState(false); const [sendAt, setSendAt] = useState(''); const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [sending, setSending] = useState(false);
  useEffect(() => { get('/settings/company').then(r => setCompany(r.data)).catch(() => {}); get('/outbound/templates').then(r => setTemplates(r.data)).catch(() => {}); get('/meetings', { limit: 100 }).then(r => setMeetings(r.data)).catch(() => {}); }, []);
  useEffect(() => { setDocs([]); setForm(f => ({ ...f, documentIds: [] })); if (form.propertyId) get('/documents', { propertyId: form.propertyId, limit: 100 }).then(r => setDocs(r.data.filter(d => d.fileUrl))).catch(() => {}); }, [form.propertyId]);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const applyTemplate = id => {
    const t = templates.find(x => x.id === id); if (!t) return;
    const p = properties.find(x => x.id === form.propertyId) || {}; const b = brands.find(x => x.id === form.brandId) || {}; const m = meetings.find(x => x.id === form.meetingId) || {};
    const vars = { company_name: company.name, contact_name: b.contactPerson || b.name, property_name: p.name, property_location: [p.address,p.city].filter(Boolean).join(', '), property_type: p.type, property_area: p.totalArea, property_rent: p.expectedRent ? `₹${Number(p.expectedRent).toLocaleString('en-IN')}` : '', property_description: p.description, meeting_title: m.title, meeting_date: m.date, meeting_time: m.time, meeting_venue: m.venue };
    const render = text => text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
    setForm(f => ({ ...f, subject: render(t.subject), body: render(t.body) }));
  };
  const submit = async e => { e.preventDefault(); setError(''); setMessage(''); setSending(true);
    try {
      const payload = { ...form, parameters: form.parameters.split('\n').filter(x => x.trim()) };
      if (scheduled) {
        if (!sendAt || !Number.isFinite(new Date(sendAt).getTime())) throw new Error('Choose a valid reminder time');
        await post('/reminders', { ...payload, sendAt: new Date(sendAt).toISOString(), consent });
        setMessage('Reminder queued. Check Notifications for its status.');
      } else { const r = await post(`/outbound/${form.channel}`, payload); setMessage(r.message + ' This is provider acceptance, not delivery confirmation.'); }
    }
    catch (err) { setError(err.response?.data?.message || err.message || 'Sending failed.'); }
    finally { setSending(false); }
  };
  return <div><div className="page-head"><div><h1>Send to client</h1><p className="muted">Compose and review property details or a meeting reminder before sending.</p></div></div>
    {error && <div className="error-box">{error}</div>}{message && <div className="success-box">{message}</div>}
    <form className="card" onSubmit={submit}><div className="form-grid">
      <Field label="Channel"><select className="input" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value, to: '', mode: scheduled && e.target.value === 'whatsapp' ? 'template' : f.mode }))}><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></Field>
      <Field label="Brand / client"><select className="input" value={form.brandId} onChange={e => { const b = brands.find(x => x.id === e.target.value); setForm(f => ({ ...f, brandId: e.target.value, to: f.channel === 'email' ? (b?.email || '') : (b?.mobile || '') })); }}><option value="">Select client (optional)</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
      <Field label="Property"><select className="input" value={form.propertyId} onChange={e => set('propertyId',e.target.value)}><option value="">Select property (optional)</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Meeting"><select className="input" value={form.meetingId} onChange={e => set('meetingId',e.target.value)}><option value="">Select meeting (optional)</option>{meetings.map(m => <option key={m.id} value={m.id}>{m.title} · {m.date}</option>)}</select></Field>
      <Field label={form.channel === 'email' ? 'Recipient email' : 'WhatsApp number with country code'}><input className="input" value={form.to} onChange={e => set('to',e.target.value)} required placeholder={form.channel === 'email' ? 'client@example.com' : '+919876543210'} /></Field>
      {(form.channel === 'email' || form.mode === 'text') && <Field label="Use message template"><select className="input" defaultValue="" onChange={e => { applyTemplate(e.target.value); e.target.value = ''; }}><option value="">Choose to fill the message…</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>}
      {form.channel === 'email' && <Field label="Subject"><input className="input" value={form.subject} onChange={e => set('subject',e.target.value)} required /></Field>}
      {form.channel === 'whatsapp' && <Field label="Message type"><select className="input" value={form.mode} onChange={e => set('mode',e.target.value)}><option value="text">Free-form text (customer service window)</option><option value="template">Meta approved template</option></select></Field>}
      {form.channel === 'whatsapp' && form.mode === 'template' ? <><Field label="Approved Meta template name"><input className="input" value={form.templateName} onChange={e => set('templateName',e.target.value)} required /></Field><Field label="Template language code"><input className="input" value={form.language} onChange={e => set('language',e.target.value)} required /></Field><Field label="Body parameters (one per line, in order)"><textarea className="input" rows="5" value={form.parameters} onChange={e => set('parameters',e.target.value)} /></Field></> : <Field label="Message (editable; include video links here)"><textarea className="input" rows="10" value={form.body} onChange={e => set('body',e.target.value)} required /></Field>}
    </div>
    {form.channel === 'email' && <div style={{ marginTop: 20 }}><strong>Attach property images and documents</strong><p className="muted">Upload files in Documents and link them to the selected property first. Up to 10 files; videos can be shared as links in the message.</p>{docs.map(d => <label key={d.id} style={{ display: 'block', margin: '8px 0' }}><input type="checkbox" checked={form.documentIds.includes(d.id)} onChange={e => set('documentIds', e.target.checked ? [...form.documentIds,d.id] : form.documentIds.filter(id => id !== d.id))} /> {d.title} ({d.fileName})</label>)}{!docs.length && <p className="muted">No uploaded files for this property.</p>}</div>}
    {form.channel === 'whatsapp' && <p className="muted">Use an approved Meta template for business-initiated messages outside the 24-hour customer service window. Obtain customer opt-in. Scheduled WhatsApp reminders require an approved template and recipient consent.</p>}
    <div style={{ marginTop: 18 }}><label><input type="checkbox" checked={scheduled} onChange={e => { setScheduled(e.target.checked); if (e.target.checked && form.channel === 'whatsapp') set('mode','template'); }} /> Schedule for later</label></div>
    {scheduled && <div style={{ marginTop: 12 }}><Field label="Send at (your local time)"><input className="input" type="datetime-local" value={sendAt} onChange={e => setSendAt(e.target.value)} required /></Field><label><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required /> I have the recipient’s consent to receive this reminder.</label><p className="muted">Queued reminders are attempted when the server is running. WhatsApp requires an approved template. Check Notifications for the outcome.</p></div>}
    <div className="form-actions"><button className="btn-primary" disabled={sending || (scheduled && form.channel === 'whatsapp' && form.mode !== 'template')}>{sending ? 'Working…' : scheduled ? 'Schedule reminder' : `Send ${form.channel === 'email' ? 'email' : 'WhatsApp'}`}</button></div>
    </form></div>;
}
