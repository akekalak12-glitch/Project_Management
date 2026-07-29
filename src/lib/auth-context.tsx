'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserRole {
  id: string;
  key: 'SUPER_ADMIN' | 'ADVISOR' | 'PROJECT_OWNER' | 'SCRUM_MASTER' | 'STAFF';
  title: string;
  permissionLevel: number;
  menuPermissions?: string; // JSON string
}

export interface Section {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  roleId: string;
  role: UserRole;
  sectionId?: string;
  section?: Section;
  projectMembers?: Array<{ projectId: string; projectRole: string }>;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  usersList: UserProfile[];
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchUserById: (userId: string) => Promise<void>;
  hasMenuAccess: (menuId: string, action?: 'view' | 'edit') => boolean;
  // Role & View Helper Flags
  isExecutive: boolean;
  isAdvisor: boolean;
  isPM: boolean;
  isScrumMaster: boolean;
  isStaff: boolean;
  canManageMasterData: boolean;
  canCreateProject: boolean;
  canManageTeam: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsersList(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const loadInitialState = async () => {
    try {
      const savedLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('is_logged_in') : null;
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('active_user_id') : null;

      if (savedLoggedIn === 'true' && savedUserId) {
        const res = await fetch(`/api/auth/me?userId=${savedUserId}`);
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setCurrentUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } catch (e) {
      console.error('Failed to load initial auth state', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    loadInitialState();
  }, []);

  const login = async (email: string, passwordInput?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const matchedUser = usersList.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!matchedUser) {
        setLoading(false);
        return false;
      }

      // Validate password if provided
      if (passwordInput && matchedUser.password && matchedUser.password !== passwordInput) {
        setLoading(false);
        return false;
      }

      const res = await fetch(`/api/auth/me?userId=${matchedUser.id}`);
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_user_id', data.user.id);
          localStorage.setItem('is_logged_in', 'true');
        }
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (e) {
      console.error('Login failed', e);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_user_id');
      localStorage.removeItem('is_logged_in');
    }
  };

  const switchUserById = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/me?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_user_id', data.user.id);
          localStorage.setItem('is_logged_in', 'true');
        }
      }
    } catch (e) {
      console.error('Failed to switch user', e);
    } finally {
      setLoading(false);
    }
  };

  const roleKey = currentUser?.role?.key;
  const isExecutive = roleKey === 'SUPER_ADMIN';
  const isAdvisor = roleKey === 'ADVISOR';
  const isPM = roleKey === 'PROJECT_OWNER';
  const isScrumMaster = roleKey === 'SCRUM_MASTER';
  const isStaff = roleKey === 'STAFF';

  // Granular Menu Access Checker
  const hasMenuAccess = (menuId: string, action: 'view' | 'edit' = 'view'): boolean => {
    if (!currentUser) return false;
    if (isExecutive) return true; // SUPER_ADMIN has full view & edit access to all menus

    const menuPermsString = currentUser.role?.menuPermissions;
    if (menuPermsString) {
      try {
        const parsed = JSON.parse(menuPermsString);
        if (parsed[menuId] !== undefined && parsed[menuId][action] !== undefined) {
          return Boolean(parsed[menuId][action]);
        }
      } catch (e) {
        // Fallthrough
      }
    }

    // Role-based fallbacks if menuPermissions JSON is unconfigured
    if (menuId === 'dashboard') return isExecutive || isAdvisor;
    if (menuId === 'portfolio') return isExecutive || isAdvisor || isPM || isScrumMaster;
    if (menuId === 'sprints') return isExecutive || isPM || isScrumMaster || isStaff;
    if (menuId === 'kanban') return true;
    if (menuId === 'masterdata') return isExecutive;
    if (menuId === 'roles') return isExecutive;

    return true;
  };

  const canManageMasterData = isExecutive;
  const canCreateProject = isExecutive || isPM;
  const canManageTeam = isExecutive || isPM || isScrumMaster;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isLoggedIn,
        usersList,
        login,
        logout,
        switchUserById,
        hasMenuAccess,
        isExecutive,
        isAdvisor,
        isPM,
        isScrumMaster,
        isStaff,
        canManageMasterData,
        canCreateProject,
        canManageTeam,
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
