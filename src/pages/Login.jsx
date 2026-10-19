import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth';
import { Field } from '../components/ui';

const DEMO = [
  { label: 'Candidate', email: 'candidate@test.com' },
  { label: 'Recruiter', email: 'recruiter@test.com' },
  { label: 'Audit', email: 'audit@test.com' },
];

export function AuthLayout({ theme = 'blue', aside, children }) {
  return (
    <div className={`auth theme-${theme}`}>
      <div className="auth-card">
        <aside className="auth-aside">
          <div className="brand brand-light">
            <div className="brand-mark">JP</div>
            <span className="brand-name">Job Portal</span>
          </div>
          {aside}
          <div className="auth-aside-glow" />
        </aside>
        <div className="auth-main">{children}</div>
      </div>
    </div>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && localStorage.getItem('credentials')) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await login(email.trim(), password);
      navigate(homeFor(data.role), { replace: true });
    } catch (err) {
      setError(err.status === 401 ? 'Invalid email or password' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      aside={
        <div className="auth-aside-body">
          <h1>Find your next opportunity — or your next hire.</h1>
          <p>One place for candidates and recruiters to meet.</p>
          <ul className="feature-list">
            <li>Browse and filter open roles</li>
            <li>Apply in one click with a cover letter</li>
            <li>Track every application's status</li>
            <li>Post jobs and manage applicants</li>
          </ul>
        </div>
      }
    >
      <h2>Welcome back</h2>
      <p className="muted">Sign in to continue to your dashboard.</p>

      <form onSubmit={submit} className="form">
        {error && <div className="alert alert-error">{error}</div>}
        <Field label="Email address">
          <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <div className="input-addon">
            <input type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" className="addon-btn" onClick={() => setShowPw((s) => !s)}>{showPw ? 'Hide' : 'Show'}</button>
          </div>
        </Field>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>

      <p className="auth-switch">
        New here? <Link to="/register/candidate">Join as candidate</Link> · <Link to="/register/recruiter">Join as recruiter</Link>
      </p>

      <div className="demo-box">
        <div className="demo-title">Demo accounts <span>password: pass123</span></div>
        <div className="demo-list">
          {DEMO.map((d) => (
            <button key={d.email} type="button" className="demo-chip" onClick={() => { setEmail(d.email); setPassword('pass123'); }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
