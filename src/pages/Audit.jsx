import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { useToast } from '../components/Toast';
import { api, formatDate, categoryLabel } from '../api';
import { Card, CategoryBadge, StatusBadge, Badge, Empty, Spinner, Field, RefreshButton, ConfirmDialog, Modal, Avatar, Icon } from '../components/ui';

export default function Audit() {
  const [tab, setTab] = useState('dashboard');
  return (
    <AppShell
      theme="slate"
      active={tab}
      onTab={setTab}
      tabs={[
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'candidates', label: 'Candidates' },
        { id: 'recruiters', label: 'Recruiters' },
        { id: 'jobs', label: 'Jobs' },
        { id: 'manage', label: 'Manage users' },
      ]}
    >
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'candidates' && <UserList kind="candidates" withHistory />}
      {tab === 'recruiters' && <UserList kind="recruiters" />}
      {tab === 'jobs' && <AllJobs />}
      {tab === 'manage' && <ManageUsers />}
    </AppShell>
  );
}

/* ---------- Dashboard ---------- */
function Dashboard() {
  const toast = useToast();
  const [stats, setStats] = useState([]);
  const [cats, setCats] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.get('/audit/stats'), api.get('/audit/jobs/by-category')]);
      setStats(s || []);
      setCats(c || {});
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const totalApps = stats.reduce((n, s) => n + (Number(s.total) || 0), 0);
  const catEntries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...catEntries.map(([, n]) => n));
  const totalJobs = catEntries.reduce((n, [, c]) => n + c, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p className="muted">Platform-wide activity at a glance.</p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="stat-grid">
            <div className="stat stat-total">
              <div className="stat-num">{totalApps}</div>
              <div className="stat-label">total applications</div>
            </div>
            {stats.map((s) => (
              <div key={s.status} className={`stat stat-${String(s.status).toLowerCase()}`}>
                <div className="stat-num">{s.total}</div>
                <div className="stat-label">{String(s.status).toLowerCase()}</div>
                {totalApps > 0 && <div className="stat-share">{Math.round((s.total / totalApps) * 100)}%</div>}
              </div>
            ))}
          </div>

          <Card title="Jobs by category" subtitle={`${totalJobs} jobs across ${catEntries.length} categories`}>
            {catEntries.length === 0 ? <Empty title="No jobs yet" /> : (
              <div className="bars">
                {catEntries.map(([cat, n]) => (
                  <div key={cat} className="bar-row">
                    <span className="bar-label">{categoryLabel(cat)}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / maxCat) * 100}%` }} /></div>
                    <span className="bar-value">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}

/* ---------- Candidates / Recruiters ---------- */
function UserList({ kind, withHistory }) {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers((await api.get(`/audit/${kind}`)) || []);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [kind, toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? users.filter((u) => `${u.id} ${u.fullName} ${u.email}`.toLowerCase().includes(q)) : users;
  }, [users, query]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/audit/users/${deleting.id}`);
      toast(`${deleting.fullName} deleted.`);
      setUsers((list) => list.filter((u) => u.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      toast(e.message || 'Could not delete user', 'error');
    } finally {
      setBusy(false);
    }
  };

  const title = kind === 'candidates' ? 'Candidates' : 'Recruiters';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="muted">{users.length} registered</p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      <Card
        actions={
          <div className="search search-sm">
            {Icon.search}
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or ID" />
          </div>
        }
        title={`All ${title.toLowerCase()}`}
      >
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty title="No users found" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th className="right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="muted mono">#{u.id}</td>
                    <td><div className="person"><Avatar name={u.fullName} size={30} /><span className="strong">{u.fullName}</span></div></td>
                    <td>{u.email}</td>
                    <td><Badge tone={u.active ? 'green' : 'yellow'}><span className="dot" />{u.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="right">
                      <div className="row-end">
                        {withHistory && <button className="btn btn-secondary btn-sm" onClick={() => setHistoryFor(u)}>History</button>}
                        <button className="btn btn-danger-soft btn-sm" onClick={() => setDeleting(u)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        message={deleting && `This permanently removes ${deleting.fullName} (${deleting.email}). This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />

      {withHistory && <HistoryModal user={historyFor} onClose={() => setHistoryFor(null)} />}
    </>
  );
}

function HistoryModal({ user, onClose }) {
  const [apps, setApps] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setApps(null);
    setError('');
    api.get(`/audit/candidates/${user.id}/history`).then((d) => setApps(d || [])).catch((e) => setError(e.message));
  }, [user]);

  return (
    <Modal open={!!user} onClose={onClose} width={760}>
      {user && (
        <>
          <div className="modal-head">
            <Avatar name={user.fullName} size={48} />
            <div>
              <h2>{user.fullName}</h2>
              <p className="muted">Application history · {user.email}</p>
            </div>
          </div>
          <div className="modal-body">
            {error ? <Empty title="Couldn't load history" hint={error} /> : !apps ? <Spinner /> : apps.length === 0 ? (
              <Empty title="No applications" hint="This candidate hasn't applied anywhere yet." />
            ) : (
              <HistoryTable apps={apps} />
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

const HistoryTable = ({ apps }) => (
  <div className="table-wrap">
    <table>
      <thead><tr><th>Job</th><th>Location</th><th>Category</th><th>Status</th><th>Applied</th></tr></thead>
      <tbody>
        {apps.map((a, i) => (
          <tr key={a.id ?? i}>
            <td className="strong">{a.jobOpening?.title || '—'}</td>
            <td>{a.jobOpening?.location || '—'}</td>
            <td><CategoryBadge category={a.jobOpening?.category} /></td>
            <td><StatusBadge status={a.status} /></td>
            <td className="muted">{formatDate(a.appliedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ---------- All jobs ---------- */
function AllJobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setJobs((await api.get('/audit/jobs')) || []);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const archived = jobs.filter((j) => j.deleted).length;
  const shown = jobs.filter((j) => filter === 'all' || (filter === 'archived' ? j.deleted : !j.deleted));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>All jobs</h1>
          <p className="muted">{jobs.length - archived} active · {archived} archived</p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>
      <div className="chips">
        {[['all', 'All'], ['active', 'Active'], ['archived', 'Archived']].map(([id, label]) => (
          <button key={id} className={`chip ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      <Card>
        {loading ? <Spinner /> : shown.length === 0 ? <Empty title="No jobs" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Title</th><th>Recruiter</th><th>Location</th><th>Category</th><th>Status</th></tr></thead>
              <tbody>
                {shown.map((j) => (
                  <tr key={j.id} className={j.deleted ? 'row-muted' : ''}>
                    <td className="muted mono">#{j.id}</td>
                    <td className="strong">{j.title}</td>
                    <td>{j.recruiter?.fullName || '—'}</td>
                    <td>{j.location}</td>
                    <td><CategoryBadge category={j.category} /></td>
                    <td><Badge tone={j.deleted ? 'gray' : 'green'}><span className="dot" />{j.deleted ? 'Archived' : 'Active'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ---------- Manage users ---------- */
const EMPTY_USER = { fullName: '', email: '', password: '', role: 'CANDIDATE' };

function ManageUsers() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_USER);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const data = await api.post('/audit/users', { ...form, active: true });
      toast(`User created with ID #${data?.id}`);
      setForm(EMPTY_USER);
    } catch (err) {
      toast(err.message || 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.del(`/audit/users/${deleteId}`);
      toast(`User #${deleteId} deleted.`);
      setDeleteId('');
      setConfirm(false);
    } catch (err) {
      toast(err.message || 'Could not delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Manage users</h1>
          <p className="muted">Create accounts for any role, or remove a user by ID.</p>
        </div>
      </div>

      <Card title="Create user">
        <form className="form" onSubmit={create}>
          <div className="grid-2">
            <Field label="Full name"><input required value={form.fullName} onChange={set('fullName')} placeholder="Full name" /></Field>
            <Field label="Email"><input required type="email" value={form.email} onChange={set('email')} placeholder="Email address" /></Field>
            <Field label="Password"><input required type="password" value={form.password} onChange={set('password')} placeholder="Password" /></Field>
            <Field label="Role">
              <div className="segmented">
                {['CANDIDATE', 'RECRUITER', 'AUDIT'].map((r) => (
                  <button type="button" key={r} className={form.role === r ? 'active' : ''} onClick={() => setForm((f) => ({ ...f, role: r }))}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="row-end">
            <button className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create user'}</button>
          </div>
        </form>
      </Card>

      <Card title="Delete user" subtitle="Permanently removes the account. Tip: you can also delete from the Candidates or Recruiters tab." className="card-danger">
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (deleteId) setConfirm(true); }}>
          <input type="number" min="1" value={deleteId} onChange={(e) => setDeleteId(e.target.value)} placeholder="User ID" />
          <button className="btn btn-danger" disabled={!deleteId}>Delete user</button>
        </form>
      </Card>

      <ConfirmDialog
        open={confirm}
        title={`Delete user #${deleteId}?`}
        message="This permanently removes the account and can't be undone."
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
