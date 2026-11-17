import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('voc_auth_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('voc_user_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('voc_auth_token', token);
    } else {
      localStorage.removeItem('voc_auth_token');
    }
  }, [token]);

  // Sync user info to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('voc_user_info', JSON.stringify(user));
    } else {
      localStorage.removeItem('voc_user_info');
    }
  }, [user]);

  async function login(username, password) {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      setToken(data.access_token);
      setUser(data.user);
      setLoading(false);
      return { success: true, user: data.user };
    } catch (err) {
      const friendlyMsg = (err.message === 'Load failed' || err.message.includes('fetch') || err.name === 'AbortError')
        ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือรอสักครู่แล้วลองใหม่)'
        : (err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');

      setError(friendlyMsg);
      setLoading(false);
      return { success: false, error: friendlyMsg };
    }
  }

  async function logout() {
    try {
      if (token) {
        await fetch(`${API}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      setToken('');
      setUser(null);
      setError(null);
      localStorage.removeItem('voc_admin_key');
    }
  }

  function hasRole(...allowedRoles) {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }

  function hasPermission(permission, minRole = 'operator') {
    if (!user) return false;
    const roleRank = { viewer: 1, operator: 2, engineer: 3, admin: 4 };
    const userRank = roleRank[user.role] || 0;
    const requiredRank = roleRank[minRole] || 0;
    return userRank >= requiredRank;
  }

  // Wrapper for authenticated API requests
  function authHeaders(customHeaders = {}) {
    const headers = { ...customHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        login,
        logout,
        hasRole,
        hasPermission,
        authHeaders,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

