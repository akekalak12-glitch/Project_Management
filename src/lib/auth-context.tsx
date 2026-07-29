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

// Default Fallback Super Admin User Profile when DB or API is unreachable
const DEFAULT_SUPER_ADMIN_USER: UserProfile = {
  id: '8b1f19e0-959c-4c6f-9f4e-fcc4ee8466d4',
  name: 'นายเอกลักษณ์ เฉลิมชีพ',
  email: 'akekalakch@treasury.go.th',
  password: '123456',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
  roleId: 'role-super-admin-uuid',
  role: {
    id: 'role-super-admin-uuid',
    key: 'SUPER_ADMIN',
    title: 'Super Admin / ผู้บริหารระดับสูง',
    permissionLevel: 100,
    menuPermissions: JSON.stringify({
      dashboard: { view: true, edit: true },
      portfolio: { view: true, edit: true },
      sprints: { view: true, edit: true },
      kanban: { view: true, edit: true },
      masterdata: { view: true, edit: true },
      roles: { view: true, edit: true },
      mytasks: { view: true, edit: true },
    }),
  },
  section: {
    id: 'sec-it-uuid',
    name: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
    code: 'IT',
    description: 'ดูแลระบบ IT ทั้งหมด',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always default to logged in as Super Admin for direct access without login barrier!
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(DEFAULT_SUPER_ADMIN_USER);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [usersList, setUsersList] = useState<UserProfile[]>([DEFAULT_SUPER_ADMIN_USER]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data: any = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setUsersList(data.data);
        }
      }
    } catch (e) {
      console.warn('API users unreachable, using default user list state', e);
    }
  };

  const loadInitialState = async () => {
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('active_user_id') : null;
      if (savedUserId) {
        const res = await fetch(`/api/auth/me?userId=${savedUserId}`);
        if (res.ok) {
          const data: any = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
          }
        }
      }
    } catch (e) {
      console.warn('API auth/me unreachable, maintaining default Super Admin profile', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    loadInitialState();
  }, []);

  const login = async (email: string, passwordInput?: string): Promise<boolean> => {
    setIsLoggedIn(true);
    setCurrentUser(DEFAULT_SUPER_ADMIN_USER);
    return true;
  };

  const logout = () => {
    // Keep user logged in with Super Admin profile
    setIsLoggedIn(true);
    setCurrentUser(DEFAULT_SUPER_ADMIN_USER);
  };

  const switchUserById = async (userId: string) => {
    try {
      const res = await fetch(`/api/auth/me?userId=${userId}`);
      if (res.ok) {
        const data: any = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setIsLoggedIn(true);
        }
      }
    } catch (e) {
      console.warn('Switch user failed, maintaining current session', e);
    }
  };

  const roleKey = currentUser?.role?.key;
  const isExecutive = roleKey === 'SUPER_ADMIN' || !roleKey;
  const isAdvisor = roleKey === 'ADVISOR';
  const isPM = roleKey === 'PROJECT_OWNER';
  const isScrumMaster = roleKey === 'SCRUM_MASTER';
  const isStaff = roleKey === 'STAFF';

  // Granular Menu Access Checker - Always grant full access by default
  const hasMenuAccess = (menuId: string, action: 'view' | 'edit' = 'view'): boolean => {
    return true;
  };

  const canManageMasterData = true;
  const canCreateProject = true;
  const canManageTeam = true;

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
