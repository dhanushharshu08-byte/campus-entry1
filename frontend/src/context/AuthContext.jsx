import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const getDashboardRoute = (role) => {
  switch ((role || '').toLowerCase()) {
    case 'student':
      return '/student/dashboard';
    case 'faculty':
      return '/faculty/dashboard';
    case 'maintenance':
      return '/maintenance/dashboard';
    case 'management':
      return '/management/dashboard';
    default:
      return '/login';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.getCurrentUser();
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        initializeSocket(res.data.user);
        return res.data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (arg1, arg2) => {
    setError(null);
    let credentials = {};
    if (typeof arg1 === 'object' && arg1 !== null) {
      credentials = {
        email: (arg1.email || '').trim().toLowerCase(),
        password: arg1.password || ''
      };
    } else {
      credentials = {
        email: (arg1 || '').trim().toLowerCase(),
        password: arg2 || ''
      };
    }

    try {
      const res = await authApi.login(credentials);
      const loggedUser = res.data.user;
      setUser(loggedUser);
      initializeSocket(loggedUser);
      return { success: true, user: loggedUser, redirect: getDashboardRoute(loggedUser.role) };
    } catch (err) {
      const msg = err.message || 'Login failed. Please check credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        logout,
        refreshUser,
        getDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
