import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('lending_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('lending_admin_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const data = await api.get('/auth/me');
          if (data.success) {
            setAdmin(data.admin);
            localStorage.setItem('lending_admin_user', JSON.stringify(data.admin));
          }
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyAuth();
  }, [token]);

  const loginAdmin = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data.success) {
      setToken(data.token);
      setAdmin(data.admin);
      localStorage.setItem('lending_admin_token', data.token);
      localStorage.setItem('lending_admin_user', JSON.stringify(data.admin));
    }
    return data;
  };

  const logout = async () => {
    try {
      if (token) await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setToken(null);
      setAdmin(null);
      localStorage.removeItem('lending_admin_token');
      localStorage.removeItem('lending_admin_user');
    }
  };

  const updateAdminState = (updatedSettings) => {
    setAdmin((prev) => {
      const next = { ...prev, ...updatedSettings };
      localStorage.setItem('lending_admin_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, loginAdmin, logout, updateAdminState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
