import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../api/services';
import api from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        // Optional: verify token here by calling me()
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return response.user;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const can = (action, resource) => {
    // Basic RBAC implementation
    if (!user) return false;
    if (user.role === 'admin') return true;
    return true; // modify as per needs
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
