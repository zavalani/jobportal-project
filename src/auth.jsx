import { createContext, useContext, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { request } from './api';

const AuthContext = createContext(null);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const homeFor = (role) =>
  ({ CANDIDATE: '/candidate', RECRUITER: '/recruiter', AUDIT: '/audit' })[role] || '/login';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const login = useCallback(async (email, password) => {
    const data = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('credentials', btoa(email + ':' + password));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('credentials');
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Only renders children if the logged-in user has the required role. */
export function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user || !localStorage.getItem('credentials')) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
