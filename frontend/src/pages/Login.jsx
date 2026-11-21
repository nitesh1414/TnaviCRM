import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@tnavicrm.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed. Is the backend running on port 5000?'); }
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo"><Building2 size={22} /></div>
          <div><div className="brand-name" style={{ color: '#111827' }}>TnaviCRM</div><div className="brand-sub" style={{ color: '#6b7280' }}>Property Leasing & Brand Relationship Management</div></div>
        </div>
        <h2 style={{ margin: '0 0 6px' }}>Welcome back</h2>
        <p className="muted" style={{ marginTop: 0 }}>Sign in to your CRM workspace</p>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
          <label className="field"><span>Email</span>
            <div style={{ position: 'relative' }}><Mail size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#9ca3af' }} />
            <input className="input" style={{ paddingLeft: 34 }} type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          </label>
          <label className="field"><span>Password</span>
            <div style={{ position: 'relative' }}><Lock size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#9ca3af' }} />
            <input className="input" style={{ paddingLeft: 34 }} type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          </label>
          <button className="btn-primary" style={{ justifyContent: 'center', padding: 12 }} disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <div className="login-hint">
          <strong>Demo accounts</strong><br />
          Admin: admin@tnavicrm.com / admin123<br />
          Manager: manager@tnavicrm.com / manager123<br />
          Employee: employee@tnavicrm.com / employee123
        </div>
      </div>
    </div>
  );
}
