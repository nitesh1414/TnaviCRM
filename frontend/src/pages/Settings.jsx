import { useEffect, useState } from 'react';
import { get, put } from '../api';
import { Field } from '../components/ui';

export default function Settings() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { get('/settings').then(r => setData(r.data)).catch(e => setError(e.response?.data?.message || 'Could not load settings')); }, []);
  const change = (section, key, value) => setData(d => ({ ...d, [section]: { ...d[section], [key]: value } }));
  const save = async e => {
    e.preventDefault(); setSaving(true); setError(''); setMessage('');
    try { const r = await put('/settings', data); setData(r.data); setMessage('Settings saved.'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to save settings'); }
    finally { setSaving(false); }
  };
  const field = (section, key, label, type = 'text', placeholder = '') => <Field label={label}><input className="input" type={type} value={data[section][key] ?? ''} placeholder={placeholder} onChange={e => change(section, key, e.target.value)} /></Field>;
  if (!data) return <div className={error ? 'error-box' : 'muted'}>{error || 'Loading settings…'}</div>;
  return <form onSubmit={save}>
    <div className="page-head"><div><h1>Company & messaging settings</h1><p className="muted">Admin-only settings for the shared company sender and editable templates.</p></div><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></div>
    {error && <div className="error-box">{error}</div>}{message && <div className="success-box">{message}</div>}
    <div className="grid-2">
      <section className="card"><h3>Company details</h3><div className="form-grid">
        {field('company','name','Company name')}{field('company','email','Company email','email')}{field('company','phone','Phone')}{field('company','website','Website')}{field('company','address','Address')}
      </div></section>
      <section className="card"><h3>Shared SMTP sender</h3><p className="muted">All emails use this account. Leave the password blank to keep the saved password.</p><div className="form-grid">
        {field('smtp','host','SMTP host')}{field('smtp','port','Port','number')}{field('smtp','user','Username')}{field('smtp','password','Password','password', data.smtp.hasPassword ? 'Saved; enter to replace' : 'Not configured')}{field('smtp','fromEmail','From email','email')}{field('smtp','fromName','From name')}
        <label><input type="checkbox" checked={!!data.smtp.secure} onChange={e => change('smtp','secure',e.target.checked)} /> Use implicit TLS (usually port 465)</label>
        <label><input type="checkbox" checked={!!data.smtp.clearPassword} onChange={e => change('smtp','clearPassword',e.target.checked)} /> Clear saved password</label>
      </div></section>
      <section className="card"><h3>Shared WhatsApp sender</h3><p className="muted">Meta WhatsApp Cloud API credentials for the company number. Leave the token blank to keep it.</p><div className="form-grid">
        {field('whatsapp','businessNumber','Business number')}{field('whatsapp','phoneNumberId','Phone number ID')}{field('whatsapp','apiVersion','Graph API version')}{field('whatsapp','accessToken','Access token','password',data.whatsapp.hasAccessToken ? 'Saved; enter to replace' : 'Not configured')}
        <label><input type="checkbox" checked={!!data.whatsapp.clearAccessToken} onChange={e => change('whatsapp','clearAccessToken',e.target.checked)} /> Clear saved token</label>
      </div></section>
    </div>
    <section className="card"><div className="page-head"><div><h3>Email templates</h3><p className="muted">Variables: {'{{company_name}}'}, {'{{contact_name}}'}, {'{{property_name}}'}, {'{{property_location}}'}, {'{{property_type}}'}, {'{{property_area}}'}, {'{{property_rent}}'}, {'{{property_description}}'}, {'{{meeting_title}}'}, {'{{meeting_date}}'}, {'{{meeting_time}}'}, {'{{meeting_venue}}'}.</p></div><button type="button" className="btn-secondary" onClick={() => setData(d => ({ ...d, templates: [...d.templates, { id: crypto.randomUUID(), name: 'New template', subject: '', body: '' }] }))}>Add template</button></div>
      {data.templates.map((t, i) => <div key={t.id} style={{ borderTop: '1px solid #e5e7eb', padding: '16px 0' }}><div className="form-grid">
        {['name','subject','body'].map(k => <Field key={k} label={k}>{k === 'body' ? <textarea className="input" rows="6" value={t[k]} onChange={e => setData(d => ({ ...d, templates: d.templates.map((item,j) => j === i ? { ...item, [k]: e.target.value } : item) }))} /> : <input className="input" value={t[k]} onChange={e => setData(d => ({ ...d, templates: d.templates.map((item,j) => j === i ? { ...item, [k]: e.target.value } : item) }))} />}</Field>)}
        <button type="button" className="btn-secondary" onClick={() => setData(d => ({ ...d, templates: d.templates.filter((_,j) => j !== i) }))}>Remove template</button>
      </div></div>)}
    </section>
  </form>;
}
