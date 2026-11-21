import { createContext, useContext, useState } from 'react';
import { post } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tnavicrm_user')); } catch { return null; }
  });

  const login = async (email, password) => {
    const res = await post('/auth/login', { email, password });
    localStorage.setItem('tnavicrm_token', res.token);
    localStorage.setItem('tnavicrm_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };
  const logout = () => {
    localStorage.removeItem('tnavicrm_token');
    localStorage.removeItem('tnavicrm_user');
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
