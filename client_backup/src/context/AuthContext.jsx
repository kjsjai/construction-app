import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { getTokens, setTokens, removeTokens } from '../lib/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { accessToken } = getTokens();
      if (accessToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          removeTokens();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { user, accessToken, refreshToken } = res.data;
    setTokens(accessToken, refreshToken);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      const { refreshToken } = getTokens();
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      removeTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
