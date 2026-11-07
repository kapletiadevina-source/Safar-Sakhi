import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('safarsakhi_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('safarsakhi_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMe = async () => {
      // 1. If no token in local storage, check if Supabase has an active session from Google login
      if (!token) {
        if (supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && isMounted) {
              const suUser = session.user;
              const email = suUser.email;
              const fullName =
                suUser.user_metadata?.full_name ||
                suUser.user_metadata?.name ||
                suUser.user_metadata?.user_name ||
                suUser.identities?.[0]?.identity_data?.full_name ||
                suUser.identities?.[0]?.identity_data?.name ||
                email.split('@')[0];
              const avatar =
                suUser.user_metadata?.avatar_url ||
                suUser.user_metadata?.picture ||
                suUser.identities?.[0]?.identity_data?.avatar_url ||
                suUser.identities?.[0]?.identity_data?.picture ||
                null;

              const res = await api.post('/auth/google-callback', {
                email,
                fullName,
                avatar,
                supabaseId: suUser.id
              });

              if (res.data.success && isMounted) {
                setToken(res.data.token);
                setUser(res.data.user);
                localStorage.setItem('safarsakhi_token', res.data.token);
                localStorage.setItem('safarsakhi_user', JSON.stringify(res.data.user));
                setLoading(false);
                return;
              }
            }
          } catch (supaErr) {
            console.warn('Auto Supabase session recovery check:', supaErr);
          }
        }

        if (isMounted) setLoading(false);
        return;
      }

      // 2. Token exists: fetch fresh user data from database to stay in sync
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && isMounted) {
          setUser(res.data.user);
          localStorage.setItem('safarsakhi_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Session verification note:', err?.message || err);
        // Only log out if backend returns 401 or 403 (token revoked or expired)
        if (err.response?.status === 401 || err.response?.status === 403) {
          if (isMounted) logout();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMe();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('safarsakhi_token', res.data.token);
      localStorage.setItem('safarsakhi_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('safarsakhi_token', res.data.token);
      localStorage.setItem('safarsakhi_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const loginWithGoogleCallback = async (googlePayload) => {
    const res = await api.post('/auth/google-callback', googlePayload);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('safarsakhi_token', res.data.token);
      localStorage.setItem('safarsakhi_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('safarsakhi_token');
    localStorage.removeItem('safarsakhi_user');
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('safarsakhi_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const updateSettings = async (settingsData) => {
    const res = await api.put('/auth/settings', settingsData);
    if (res.data.success) {
      setUser((prev) => ({
        ...prev,
        settings: res.data.settings
      }));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        isFamily: user?.role === 'FAMILY',
        isUser: user?.role === 'USER',
        login,
        register,
        loginWithGoogleCallback,
        logout,
        updateProfile,
        updateSettings
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
