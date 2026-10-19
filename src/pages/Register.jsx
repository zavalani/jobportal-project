import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../api';
import { Field } from '../components/ui';
import { AuthLayout } from './Login';

const COPY = {
  candidate: {
    theme: 'blue',
    title: 'Create your account',
    subtitle: 'Join as a candidate and start applying for jobs.',
    headline: 'Your next role is a few clicks away.',
    points: ['Discover roles across 8 categories', 'Apply with a personal cover letter', 'See when recruiters review you'],
    endpoint: '/auth/register/candidate',
    other: { to: '/register/recruiter', label: 'Hiring instead? Register as recruiter' },
  },
  recruiter: {
    theme: 'purple',
    title: 'Register as recruiter',
    subtitle: 'Post jobs and find the right people for your team.',
    headline: 'Hire faster, with less noise.',
    points: ['Publish openings in minutes', 'Review applicants and cover letters', 'Move candidates through each stage'],
    endpoint: '/auth/register/recruiter',
    other: { to: '/register/candidate', label: 'Looking for a job? Register as candidate' },
  },
};

export default function Register({ role }) {
  const c = COPY[role];
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password.length < 6) return setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    setBusy(true);
    try {
      await request(c.endpoint, { method: 'POST', body: { ...form, email: form.email.trim() }, auth: false });
      setMsg({ type: 'success', text: 'Account created! Redirecting to sign in…' });
      setTimeout(() => navigate('/login'), 1300);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Registration failed' });
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      theme={c.theme}
      aside={
        <div className="auth-aside-body">
          <h1>{c.headline}</h1>
          <ul className="feature-list">{c.points.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      }
    >
      <h2>{c.title}</h2>
      <p className="muted">{c.subtitle}</p>
      <form onSubmit={submit} className="form">
        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        <Field label="Full name">
          <input required autoFocus value={form.fullName} onChange={set('fullName')} placeholder="Your full name" />
        </Field>
        <Field label="Email address">
          <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </Field>
        <Field label="Password" hint="min. 6 characters">
          <input type="password" required value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
        </Field>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      <p className="auth-switch small"><Link to={c.other.to}>{c.other.label}</Link></p>
    </AuthLayout>
  );
}
