import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { initials } from './ui';

const ROLE_LABEL = { CANDIDATE: 'Candidate', RECRUITER: 'Recruiter', AUDIT: 'Audit' };

/**
 * Shared top navigation + page container.
 * tabs: [{ id, label, count? }], active: id, onTab: (id) => void
 */
export default function AppShell({ theme, tabs, active, onTab, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app theme-${theme}`}>
      <nav className="topnav">
        <div className="topnav-inner">
          <div className="brand">
            <div className="brand-mark">JP</div>
            <span className="brand-name">Job Portal</span>
            <span className="role-pill">{ROLE_LABEL[user?.role]}</span>
          </div>

          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={active === t.id}
                className={`tab ${active === t.id ? 'active' : ''}`}
                onClick={() => onTab(t.id)}
              >
                {t.label}
                {t.count != null && <span className="tab-count">{t.count}</span>}
              </button>
            ))}
          </div>

          <div className="user-menu">
            <div className="user-chip" title={user?.email}>
              <span className="user-avatar">{initials(user?.fullName)}</span>
              <span className="user-name">{user?.fullName}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </nav>
      <main className="page">{children}</main>
    </div>
  );
}
