import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  user: 'asomar_user',
  accessToken: 'asomar_access_token',
  refreshToken: 'asomar_refresh_token',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.user);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.user);
      return null;
    }
  });
  const [tokens, setTokens] = useState(() => ({
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken),
  }));

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';

  const logout = useCallback(() => {
    if (tokens?.accessToken) {
      fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }).catch(() => {
        // Ignore logout failures; local state is cleared below.
      });
    }
    setTokens({ accessToken: null, refreshToken: null });
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
  }, [apiUrl, tokens?.accessToken]);

  const registerDeviceToken = useCallback(
    async (platform, token) => {
      if (!platform || !token || !tokens?.accessToken) {
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/devices/register-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ platform, token }),
        });
        if (response.status === 401) {
          logout();
        }
      } catch {
        // Stub: ignore errors for now.
      }
    },
    [apiUrl, tokens?.accessToken, logout],
  );

  const login = async (dni, password) => {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, password }),
    });

    if (!response.ok) {
      const message = response.status === 401 ? 'Credenciales invalidas' : 'Error al iniciar sesion';
      throw new Error(message);
    }

    const data = await response.json();

    setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    const nextUser = {
      ...data.user,
      mustChangePassword: Boolean(data.mustChangePassword),
    };
    setUser(nextUser);

    localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refreshToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));

    return nextUser;
  };

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      tokens,
      login,
      logout,
      registerDeviceToken,
      updateUser,
    }),
    [user, tokens, login, logout, registerDeviceToken, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
