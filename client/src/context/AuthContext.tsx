import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  activeRole: UserRole;
  switchRole: (role: UserRole) => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role email map for seamless 1-click evaluator role switching
const ROLE_EMAILS: Record<UserRole, string> = {
  institution: 'institution@flowx.demo',
  regional_officer: 'ro.western@flowx.demo',
  regulation_bureau: 'rb.director@flowx.demo',
  evc_member: 'evc.lead@flowx.demo',
  committee_member: 'committee.sac@flowx.demo',
  admin: 'admin@flowx.demo'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole>(
    (localStorage.getItem('flowx_active_role') as UserRole) || 'institution'
  );
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUnreadCount = async () => {
    try {
      const res = await api.getNotifications(true);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
        setActiveRole(res.user.role);
        localStorage.setItem('flowx_active_role', res.user.role);
        localStorage.setItem('flowx_active_user_id', res.user.id);
      }
    } catch (err) {
      console.warn('Failed to fetch profile, using demo fallback:', err);
    } finally {
      setLoading(false);
      refreshUnreadCount();
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const switchRole = async (newRole: UserRole) => {
    try {
      setLoading(true);
      const email = ROLE_EMAILS[newRole];
      const res = await api.login({ email, password: 'Demo@123' });
      if (res.user && res.token) {
        localStorage.setItem('flowx_token', res.token);
        localStorage.setItem('flowx_active_role', newRole);
        localStorage.setItem('flowx_active_user_id', res.user.id);
        setUser(res.user);
        setActiveRole(newRole);
      }
    } catch (err) {
      console.error('Role switch error:', err);
    } finally {
      setLoading(false);
      refreshUnreadCount();
    }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.user && res.token) {
        localStorage.setItem('flowx_token', res.token);
        localStorage.setItem('flowx_active_role', res.user.role);
        localStorage.setItem('flowx_active_user_id', res.user.id);
        setUser(res.user);
        setActiveRole(res.user.role);
      }
    } finally {
      setLoading(false);
      refreshUnreadCount();
    }
  };

  const logout = () => {
    localStorage.removeItem('flowx_token');
    localStorage.removeItem('flowx_active_role');
    localStorage.removeItem('flowx_active_user_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeRole,
        switchRole,
        login,
        logout,
        unreadCount,
        refreshUnreadCount
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
