// Central API client. Change the base URL here (or set VITE_API_URL in a .env file).
export const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const CATEGORIES = [
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALES', label: 'Sales' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'DATA_SCIENCE', label: 'Data Science' },
  { value: 'HUMAN_RESOURCES', label: 'Human Resources' },
  { value: 'OTHER', label: 'Other' },
];

export const STATUSES = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'];

export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v || '—';

function authHeader() {
  const creds = localStorage.getItem('credentials');
  return creds ? { Authorization: 'Basic ' + creds } : {};
}

/**
 * fetch wrapper: adds auth + JSON headers, parses the body safely,
 * and throws an Error with the server's message on non-2xx responses.
 */
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? authHeader() : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = (data && data.error) || (typeof data === 'string' && data) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
};

export const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso.substring(0, 10);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
