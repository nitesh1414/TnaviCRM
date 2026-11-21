import { useState } from 'react';
import { post } from '../api';
import { useAuth } from '../context/AuthContext';
import { Field, fmtDate, fmtINR } from './ui';

export default function ProposalDetail({ initial, lookups, canWrite, onChange }) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [proposal, setProposal] = useState(initial);
  const [offer, setOffer] = useState({ by: 'Brand', rent: '', date: new Date().toISOString().slice(0,10), notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async e => { e.preventDefault(); setSaving(true); setError(''); try { const r = await post(`/proposals/${proposal.id}/counter-offers`, offer); setProposal(r.data); onChange(); setOffer({ by:'Brand', rent:'', date:new Date().toISOString().slice(0,10), notes:'' }); } catch (err) { setError(err.response?.data?.message || 'Could not add counter-offer'); } finally { setSaving(false); } };
  const transition = async action => { setError(''); setSaving(true); try { const r = await post(`/proposals/${proposal.id}/approval`, { action, note }); setProposal(r.data); setNote(''); onChange(); } catch (err) { setError(err.response?.data?.message || 'Approval action failed'); } finally { setSaving(false); } };
  const state = proposal.approvalState || 'Draft';
  const reviewer = ['admin','manager'].includes(user?.role);
  return <section className="proposal-detail">
    <div className="proposal-print-heading"><h2>{proposal.title}</h2><p>Property leasing proposal</p></div>
    <dl className="kv"><dt>Brand</dt><dd>{lookups.brandName(proposal.brandId)}</dd><dt>Property</dt><dd>{lookups.propName(proposal.propertyId)}</dd><dt>Proposed rent</dt><dd>{fmtINR(proposal.proposedRent)} / month</dd><dt>Security deposit</dt><dd>{fmtINR(proposal.securityDeposit)}</dd><dt>Lease period</dt><dd>{proposal.leasePeriod || '—'} years</dd><dt>Escalation</dt><dd>{proposal.escalation || '—'}</dd><dt>Commercial terms</dt><dd style={{whiteSpace:'pre-wrap'}}>{proposal.terms || '—'}</dd><dt>Stage / status</dt><dd>{proposal.stage} / {proposal.status}</dd></dl>
    <div className="no-print" style={{marginTop:24}}><h3>Approval · {state}</h3>
      {error && <div className="error-box">{error}</div>}
      <Field label="Approval note (required for decision)"><textarea className="input" value={note} onChange={e => setNote(e.target.value)} rows="2" /></Field>
      <div className="page-actions" style={{marginTop:10}}>
        {canWrite && ['Draft','Rejected'].includes(state) && <button type="button" className="btn-secondary" disabled={saving} onClick={() => transition('request')}>Request approval</button>}
        {reviewer && state === 'Pending' && <><button type="button" className="btn-primary" disabled={saving} onClick={() => transition('approve')}>Approve</button><button type="button" className="btn-danger" disabled={saving} onClick={() => transition('reject')}>Reject</button></>}
        {reviewer && ['Approved','Rejected'].includes(state) && <button type="button" className="btn-secondary" disabled={saving} onClick={() => transition('reopen')}>Reopen</button>}
      </div>
      {(proposal.approvalHistory || []).slice().reverse().map((a,i) => <div className="list-item" key={i}><div><strong>{a.from} → {a.to}</strong><div className="muted">{a.actorName} · {a.note || 'No note'}</div></div><span className="muted">{fmtDate(a.at)}</span></div>)}
    </div>
    <h3 style={{marginTop:24}}>Counter-offers</h3>
    {(proposal.counterOffers || []).map((item,i) => <div className="list-item" key={item.id || i}><div><strong>{item.by} · {fmtINR(item.rent)}</strong><div className="muted">{item.notes || ''}</div></div><span className="muted">{fmtDate(item.date)}</span></div>)}
    {!(proposal.counterOffers || []).length && <p className="muted">No counter-offers recorded.</p>}
    {canWrite && !['Pending','Approved'].includes(state) && <form className="no-print" onSubmit={save} style={{marginTop:16}}><div className="form-grid"><Field label="From"><select className="input" value={offer.by} onChange={e => setOffer({...offer,by:e.target.value})}>{['Brand','Owner','Company'].map(x => <option key={x}>{x}</option>)}</select></Field><Field label="Monthly rent (₹)"><input className="input" type="number" min="0" value={offer.rent} onChange={e => setOffer({...offer,rent:e.target.value})} required /></Field><Field label="Date"><input className="input" type="date" value={offer.date} onChange={e => setOffer({...offer,date:e.target.value})} required /></Field><Field label="Notes"><input className="input" value={offer.notes} onChange={e => setOffer({...offer,notes:e.target.value})} /></Field></div>{error && <div className="error-box">{error}</div>}<div className="form-actions"><button className="btn-primary" disabled={saving}>Add counter-offer</button></div></form>}
    <div className="no-print"><h3 style={{marginTop:24}}>Revision history</h3>{(proposal.revisions || []).slice().reverse().map((r,i) => <div className="list-item" key={i}><div><strong>{r.event}</strong><div className="muted">{r.actorName} · {r.snapshot?.stage} / {r.snapshot?.status}</div></div><span className="muted">{fmtDate(r.at)}</span></div>)}{!(proposal.revisions || []).length && <p className="muted">No revisions recorded for this older proposal.</p>}<button className="btn-secondary" onClick={() => window.print()}>Print / save PDF</button></div>
  </section>;
}
