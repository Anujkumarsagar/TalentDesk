import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'talentdesk_token';
const USER_KEY = 'talentdesk_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });
  const [ready, setReady] = useState(!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) { setReady(true); return; }
    api.auth.me()
      .then(({ user: current }) => setUser((prev) => ({ ...prev, ...current })))
      .catch(() => logout())
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('talentdesk:unauthorized', onUnauthorized);
    return () => window.removeEventListener('talentdesk:unauthorized', onUnauthorized);
  }, []);

  async function login(email, password) {
    const data = await api.auth.login({ email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  const isRecruiter = user?.role === 'RECRUITER';

  return (
    <AuthContext.Provider value={{ user, ready, isRecruiter, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
