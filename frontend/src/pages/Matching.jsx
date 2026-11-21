import { useState } from 'react';
import { GitCompareArrows, Send, FileText } from 'lucide-react';
import { get, post } from '../api';
import { Badge, fmtINR, useLookups } from '../components/ui';

export default function Matching() {
  const lookups = useLookups();
  const [brandId, setBrandId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [history, setHistory] = useState(null);

  const runMatch = async () => {
    if (!brandId) return;
    setLoading(true); setMsg('');
    try {
      const res = await post('/matching/score', { brandId });
      setResult(res.data);
      const h = await get(`/matching/brand/${brandId}/properties`);
      setHistory(h.data);
    } catch (err) { setMsg(err.response?.data?.message || 'Matching failed'); }
    setLoading(false);
  };

  const shareWithBrand = async (property) => {
    // Creates a lead record representing sharing the property with the brand
    try {
      await post('/leads', { title: `Shared: ${property.name} → ${result.brand.name}`, brandId, propertyId: property.id, source: 'Direct', status: 'Contacted', notes: 'Interest recorded via matching module; property details not sent.' });
      setMsg(`Recorded interest in "${property.name}" for ${result.brand.name} (lead created; no message was sent).`);
      const h = await get(`/matching/brand/${brandId}/properties`);
      setHistory(h.data);
    } catch { setMsg('Failed to share'); }
  };

  const scoreColor = (s) => s >= 80 ? '#dcfce7' : s >= 50 ? '#fef3c7' : '#fee2e2';
  const scoreText = (s) => s >= 80 ? '#166534' : s >= 50 ? '#92400e' : '#991b1b';

  return (
    <div>
      <div className="page-head"><div><h1>Property & Brand Matching</h1><p className="muted">Score available properties against a brand's location, area, budget and type requirements</p></div></div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label className="field" style={{ minWidth: 260 }}><span>Select Brand</span>
            <select className="input" value={brandId} onChange={e => setBrandId(e.target.value)}>
              <option value="">Choose a brand…</option>
              {lookups.brands.map(b => <option key={b.id} value={b.id}>{b.name} — {b.category}</option>)}
            </select>
          </label>
          <button className="btn-primary" onClick={runMatch} disabled={!brandId || loading}><GitCompareArrows size={16} /> {loading ? 'Matching…' : 'Find Matches'}</button>
        </div>
        {result && (
          <div style={{ marginTop: 14, fontSize: 14 }}>
            <strong>{result.brand.name}</strong> requirements: min area {result.brand.requirements?.minArea || '—'} sq.ft · budget up to {fmtINR(result.brand.requirements?.maxBudget)} · locations {(result.brand.requirements?.preferredLocations || []).join(', ') || '—'} · types {(result.brand.requirements?.propertyTypes || []).join(', ') || '—'}
          </div>
        )}
        {msg && <div className="success-box" style={{ marginTop: 12 }}>{msg}</div>}
      </div>

      {result && (
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead><tr><th>Match Score</th><th>Property</th><th>City / Area</th><th>Type</th><th>Area</th><th>Rent</th><th>Status</th><th>Why it matches</th><th>Action</th></tr></thead>
            <tbody>
              {result.matches.map(({ property: p, score, reasons }) => (
                <tr key={p.id}>
                  <td><div className="score-ring" style={{ background: scoreColor(score), color: scoreText(score), width: 52, height: 52, fontSize: 15 }}>{score}</div></td>
                  <td><strong>{p.name}</strong></td><td>{p.city} / {p.area}</td><td>{p.type}</td>
                  <td>{p.totalArea} sq.ft</td><td>{fmtINR(p.expectedRent)}/mo</td><td><Badge value={p.status} /></td>
                  <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{reasons.map((r, i) => <span key={i} className="badge gray">{r}</span>)}</div></td>
                  <td><button className="btn-secondary" onClick={() => shareWithBrand(p)}><Send size={14} /> Record interest</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {history && (
        <div className="grid-2">
          <div className="card">
            <h3><FileText size={16} /> Enquiries for this brand ({history.leads.length})</h3>
            {history.leads.map(l => <div key={l.id} className="list-item"><div><strong>{l.title}</strong><div className="muted">{lookups.propName(l.propertyId)}</div></div><Badge value={l.status} /></div>)}
            {!history.leads.length && <p className="muted">No enquiries yet</p>}
          </div>
          <div className="card">
            <h3>Proposals for this brand ({history.proposals.length})</h3>
            {history.proposals.map(p => <div key={p.id} className="list-item"><div><strong>{p.title}</strong><div className="muted">{fmtINR(p.proposedRent)}/mo</div></div><Badge value={p.stage} /></div>)}
            {!history.proposals.length && <p className="muted">No proposals yet</p>}
          </div>
        </div>
      )}
    </div>
  );
}
