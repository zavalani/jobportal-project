import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { useToast } from '../components/Toast';
import { api, CATEGORIES, STATUSES, formatDate } from '../api';
import { Card, CategoryBadge, StatusBadge, Badge, Empty, Spinner, Modal, Field, RefreshButton, Avatar, Icon } from '../components/ui';

export default function Candidate() {
  const toast = useToast();
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const loadApps = useCallback(async () => {
    try {
      setApps((await api.get('/candidate/applications')) || []);
    } catch (e) {
      toast(e.message, 'error');
    }
  }, [toast]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const path = category ? `/candidate/jobs/filter?category=${category}` : '/candidate/jobs';
      const [j] = await Promise.all([api.get(path), loadApps()]);
      setJobs(j || []);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [category, loadApps, toast]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const appliedIds = useMemo(() => new Set(apps.map((a) => a.jobOpening?.id)), [apps]);

  const visibleJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.title, j.location, j.description, j.recruiter?.fullName].some((v) => v?.toLowerCase().includes(q))
    );
  }, [jobs, query]);

  const statusCounts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    apps.forEach((a) => { if (a.status in c) c[a.status]++; });
    return c;
  }, [apps]);

  return (
    <AppShell
      theme="blue"
      active={tab}
      onTab={(t) => { setTab(t); if (t === 'applications') loadApps(); }}
      tabs={[
        { id: 'jobs', label: 'Browse jobs' },
        { id: 'applications', label: 'My applications', count: apps.length },
      ]}
    >
      {tab === 'jobs' && (
        <>
          <div className="page-head">
            <div>
              <h1>Find your next role</h1>
              <p className="muted">{loading ? 'Loading openings…' : `${visibleJobs.length} open position${visibleJobs.length === 1 ? '' : 's'}`}</p>
            </div>
            <RefreshButton onClick={loadJobs} loading={loading} />
          </div>

          <div className="toolbar">
            <div className="search">
              {Icon.search}
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, location, company…" />
            </div>
          </div>
          <div className="chips">
            <button className={`chip ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>All</button>
            {CATEGORIES.map((c) => (
              <button key={c.value} className={`chip ${category === c.value ? 'active' : ''}`} onClick={() => setCategory(c.value)}>
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Spinner label="Loading jobs…" />
          ) : visibleJobs.length === 0 ? (
            <Card><Empty title="No jobs match your filters" hint="Try another category or clear your search." /></Card>
          ) : (
            <div className="job-grid">
              {visibleJobs.map((j) => (
                <button key={j.id} className="job-card" onClick={() => setSelected(j)}>
                  <div className="job-card-top">
                    <Avatar name={j.recruiter?.fullName || 'R'} />
                    {appliedIds.has(j.id) && <Badge tone="green">{Icon.check} Applied</Badge>}
                  </div>
                  <h3>{j.title}</h3>
                  <div className="job-company">{j.recruiter?.fullName}</div>
                  <p className="job-desc">{j.description}</p>
                  <div className="job-meta">
                    <CategoryBadge category={j.category} />
                    <Badge>{Icon.pin} {j.location}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'applications' && (
        <>
          <div className="page-head">
            <div>
              <h1>My applications</h1>
              <p className="muted">Track where each application stands.</p>
            </div>
            <RefreshButton onClick={loadApps} />
          </div>

          <div className="stat-grid">
            {STATUSES.map((s) => (
              <div key={s} className={`stat stat-${s.toLowerCase()}`}>
                <div className="stat-num">{statusCounts[s]}</div>
                <div className="stat-label">{s.toLowerCase()}</div>
              </div>
            ))}
          </div>

          <Card>
            {apps.length === 0 ? (
              <Empty title="No applications yet" hint="Browse jobs and apply to see them here.">
                <button className="btn btn-primary" onClick={() => setTab('jobs')}>Browse jobs</button>
              </Empty>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Job</th><th>Location</th><th>Category</th><th>Status</th><th>Applied</th></tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.id}>
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
            )}
          </Card>
        </>
      )}

      <JobModal
        job={selected}
        applied={selected && appliedIds.has(selected.id)}
        onClose={() => setSelected(null)}
        onApplied={() => { setSelected(null); loadApps(); }}
      />
    </AppShell>
  );
}

function JobModal({ job, applied, onClose, onApplied }) {
  const toast = useToast();
  const [cover, setCover] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setCover(''); }, [job?.id]);

  const apply = async () => {
    setBusy(true);
    try {
      await api.post('/candidate/apply', { jobId: job.id, coverLetter: cover });
      toast('Application submitted!');
      onApplied();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!job} onClose={onClose}>
      {job && (
        <>
          <div className="modal-head">
            <Avatar name={job.recruiter?.fullName || 'R'} size={52} />
            <div>
              <h2>{job.title}</h2>
              <p className="muted">{job.recruiter?.fullName}</p>
            </div>
          </div>
          <div className="modal-body">
            <div className="job-meta">
              <CategoryBadge category={job.category} />
              <Badge>{Icon.pin} {job.location}</Badge>
            </div>
            <h4 className="eyebrow">About the role</h4>
            <p className="prose">{job.description}</p>
          </div>
          <div className="modal-foot">
            {applied ? (
              <div className="applied-note">{Icon.check} You've already applied to this job.</div>
            ) : (
              <>
                <Field label="Cover letter" hint="optional">
                  <textarea rows={4} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Tell the recruiter why you're a great fit…" />
                </Field>
                <div className="row-end">
                  <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                  <button className="btn btn-primary" onClick={apply} disabled={busy}>{busy ? 'Submitting…' : 'Apply now'}</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
