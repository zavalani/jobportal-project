import { useCallback, useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import { useToast } from '../components/Toast';
import { api, CATEGORIES, STATUSES, formatDate } from '../api';
import { Card, CategoryBadge, StatusBadge, Badge, Empty, Spinner, Field, RefreshButton, ConfirmDialog, Avatar, Icon } from '../components/ui';

const EMPTY_JOB = { title: '', location: '', category: 'ENGINEERING', description: '' };

export default function Recruiter() {
  const toast = useToast();
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [applicantsFor, setApplicantsFor] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      setJobs((await api.get('/recruiter/jobs')) || []);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const archive = async () => {
    setBusy(true);
    try {
      await api.del(`/recruiter/jobs/${archiving.id}`);
      toast('Job archived.');
      setArchiving(null);
      loadJobs();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const active = jobs.filter((j) => !j.deleted);

  return (
    <AppShell
      theme="purple"
      active={tab}
      onTab={setTab}
      tabs={[
        { id: 'jobs', label: 'My jobs', count: active.length },
        { id: 'post', label: 'Post a job' },
        { id: 'applicants', label: 'Applicants' },
      ]}
    >
      {tab === 'jobs' && (
        <>
          <div className="page-head">
            <div>
              <h1>My job postings</h1>
              <p className="muted">{active.length} active · {jobs.length - active.length} archived</p>
            </div>
            <div className="row-end">
              <RefreshButton onClick={loadJobs} loading={loading} />
              <button className="btn btn-primary" onClick={() => setTab('post')}>+ New job</button>
            </div>
          </div>
          <Card>
            {loading ? <Spinner /> : jobs.length === 0 ? (
              <Empty title="No jobs posted yet" hint="Publish your first opening to start receiving applicants.">
                <button className="btn btn-primary" onClick={() => setTab('post')}>Post a job</button>
              </Empty>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Title</th><th>Location</th><th>Category</th><th>Status</th><th className="right">Actions</th></tr></thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.id} className={j.deleted ? 'row-muted' : ''}>
                        <td className="strong">{j.title}</td>
                        <td>{j.location}</td>
                        <td><CategoryBadge category={j.category} /></td>
                        <td><Badge tone={j.deleted ? 'gray' : 'green'}><span className="dot" />{j.deleted ? 'Archived' : 'Active'}</Badge></td>
                        <td className="right">
                          {!j.deleted && (
                            <div className="row-end">
                              <button className="btn btn-secondary btn-sm" onClick={() => { setApplicantsFor(String(j.id)); setTab('applicants'); }}>Applicants</button>
                              <button className="btn btn-danger-soft btn-sm" onClick={() => setArchiving(j)}>Archive</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'post' && <PostJob onPosted={() => { loadJobs(); setTab('jobs'); }} />}

      {tab === 'applicants' && <Applicants jobs={jobs} selected={applicantsFor} onSelect={setApplicantsFor} />}

      <ConfirmDialog
        open={!!archiving}
        title="Archive this job?"
        message={archiving && `"${archiving.title}" will be hidden from candidates. Existing applications are kept.`}
        confirmLabel="Archive"
        danger
        busy={busy}
        onConfirm={archive}
        onCancel={() => setArchiving(null)}
      />
    </AppShell>
  );
}

function PostJob({ onPosted }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_JOB);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim() || !form.description.trim()) {
      return toast('Please fill in all fields.', 'error');
    }
    setBusy(true);
    try {
      await api.post('/recruiter/jobs', form);
      toast('Job posted!');
      setForm(EMPTY_JOB);
      onPosted();
    } catch (err) {
      toast(err.message || 'Failed to post job', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Post a new job</h1>
          <p className="muted">Candidates will see this as soon as you publish.</p>
        </div>
      </div>
      <Card>
        <form className="form" onSubmit={submit}>
          <div className="grid-2">
            <Field label="Job title"><input value={form.title} onChange={set('title')} placeholder="e.g. Java Developer" /></Field>
            <Field label="Location"><input value={form.location} onChange={set('location')} placeholder="e.g. Tirana, Albania" /></Field>
          </div>
          <Field label="Category">
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Description" hint={`${form.description.length} chars`}>
            <textarea rows={7} value={form.description} onChange={set('description')} placeholder="Describe the role, requirements and responsibilities…" />
          </Field>
          <div className="row-end">
            <button type="button" className="btn btn-secondary" onClick={() => setForm(EMPTY_JOB)}>Clear</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish job'}</button>
          </div>
        </form>
      </Card>
    </>
  );
}

function Applicants({ jobs, selected, onSelect }) {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({});

  const jobId = selected || (jobs[0] ? String(jobs[0].id) : '');

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError('');
    try {
      const data = (await api.get(`/recruiter/jobs/${jobId}/applicants`)) || [];
      setList(data);
      setDraft(Object.fromEntries(data.map((a) => [a.id, a.status])));
    } catch (e) {
      setError(e.message);
      setList(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const save = async (appId) => {
    try {
      await api.patch(`/recruiter/applications/${appId}/status?status=${draft[appId]}`);
      toast('Status updated.');
      setList((l) => l.map((a) => (a.id === appId ? { ...a, status: draft[appId] } : a)));
    } catch (e) {
      toast(e.message || 'Failed to update status', 'error');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Applicants</h1>
          <p className="muted">Review candidates and move them through your pipeline.</p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {jobs.length === 0 ? (
        <Card><Empty title="No jobs yet" hint="Post a job to start receiving applicants." /></Card>
      ) : (
        <>
          <Card>
            <Field label="Job">
              <select value={jobId} onChange={(e) => onSelect(e.target.value)}>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} — {j.location}{j.deleted ? ' (archived)' : ''}</option>
                ))}
              </select>
            </Field>
          </Card>

          {loading ? <Spinner label="Loading applicants…" /> : error ? (
            <Card><Empty title="Couldn't load applicants" hint={error} /></Card>
          ) : !list || list.length === 0 ? (
            <Card><Empty title="No applicants yet" hint="Applications for this job will show up here." /></Card>
          ) : (
            <div className="applicant-list">
              {list.map((a) => (
                <article key={a.id} className="applicant">
                  <Avatar name={a.candidate?.fullName} size={44} />
                  <div className="applicant-info">
                    <div className="applicant-top">
                      <h4>{a.candidate?.fullName || '—'}</h4>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="muted small">{a.candidate?.email} · Applied {formatDate(a.appliedAt)}</p>
                    {a.coverLetter && <blockquote className="cover">{a.coverLetter}</blockquote>}
                  </div>
                  <div className="applicant-actions">
                    <select value={draft[a.id] || a.status} onChange={(e) => setDraft((d) => ({ ...d, [a.id]: e.target.value }))}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" disabled={draft[a.id] === a.status} onClick={() => save(a.id)}>Save</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
