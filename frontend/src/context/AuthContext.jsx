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
  // Hydrate user from localStorage on initial render for instant resilience
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('campusentry_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.getCurrentUser();
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        try {
          localStorage.setItem('campusentry_user', JSON.stringify(res.data.user));
        } catch {
          // localStorage write failure ignore
        }
        initializeSocket(res.data.user);
        return res.data.user;
      } else {
        setUser(null);
        try {
          localStorage.removeItem('campusentry_user');
        } catch {}
        return null;
      }
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        try {
          localStorage.removeItem('campusentry_user');
        } catch {}
      }
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
      try {
        localStorage.setItem('campusentry_user', JSON.stringify(loggedUser));
      } catch {}
      initializeSocket(loggedUser);
      return { success: true, user: loggedUser, redirect: getDashboardRoute(loggedUser.role) };
    } catch (err) {
      const msg = err.message || 'Login failed. Please check credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await authApi.register(userData);
      if (res.data?.success && res.data?.user) {
        const registeredUser = res.data.user;
        setUser(registeredUser);
        try {
          localStorage.setItem('campusentry_user', JSON.stringify(registeredUser));
        } catch {}
        initializeSocket(registeredUser);
        return {
          success: true,
          user: registeredUser,
          redirect: getDashboardRoute(registeredUser.role),
          message: res.data.message || 'Registration successful. Welcome to CampuSentry!',
        };
      }
      return { success: false, error: res.data?.message || 'Registration failed.' };
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      return { success: false, error: msg, errors: err.errors };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem('campusentry_user');
      } catch {}
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
        register,
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
