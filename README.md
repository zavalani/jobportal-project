# Job Portal — React frontend

React 18 + Vite + React Router rewrite of the original HTML pages. Talks to the same Spring backend at `http://localhost:8080/api` with the same endpoints and Basic auth.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

To point at a different backend, create `.env`:

```
VITE_API_URL=http://localhost:8080/api
```

> **CORS:** the dev server runs on port 5173, so your backend must allow `http://localhost:5173` as an origin (e.g. `@CrossOrigin(origins = "http://localhost:5173")` or a global `CorsConfigurationSource`).

## Routes

| Path | Page | Role |
|---|---|---|
| `/login` | Sign in | public |
| `/register/candidate` | Candidate sign-up | public |
| `/register/recruiter` | Recruiter sign-up | public |
| `/candidate` | Browse jobs, my applications | CANDIDATE |
| `/recruiter` | My jobs, post a job, applicants | RECRUITER |
| `/audit` | Dashboard, candidates, recruiters, jobs, manage users | AUDIT |

Routes are guarded by `RequireRole`; a signed-in user hitting the wrong dashboard is redirected to their own.

## Structure

```
src/
  api.js              fetch wrapper, constants (categories, statuses), helpers
  auth.jsx            AuthProvider, useAuth, RequireRole
  index.css           design tokens + all styles (per-role accent themes)
  components/
    AppShell.jsx      top nav with tabs + user chip
    Toast.jsx         toast provider / useToast()
    ui.jsx            Card, Badge, StatusBadge, Modal, ConfirmDialog, Field, Spinner, Empty, Avatar, icons
  pages/
    Login.jsx  Register.jsx  Candidate.jsx  Recruiter.jsx  Audit.jsx
```

## What changed vs. the HTML version

- **Safer rendering** – no more `innerHTML`; job descriptions, cover letters etc. can't inject HTML.
- **Candidate** – live text search + category chips, applied badge on cards, status summary cards, nicer job modal (Esc / click-outside to close).
- **Recruiter** – archive asks for confirmation, "Applicants" shortcut on each job row, applicants auto-load when you pick a job, Save is disabled until status changes, list updates in place.
- **Audit** – total + per-status stat cards with %, horizontal bar chart for jobs by category, search on user tables, candidate history opens from the row, delete confirmation, deleted users disappear from the list, active/archived job filter, role picker as segmented control.
- **Auth** – real `<form>` submit (Enter works), show/hide password, one-click demo account fill, password length check on register.
- Loading spinners, empty states, error messages from the server shown in toasts, responsive layout for mobile.
