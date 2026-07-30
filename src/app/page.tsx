'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navigation from '@/components/Navigation';
import ExecutiveDashboard from '@/components/ExecutiveDashboard';
import ProjectPortfolio from '@/components/ProjectPortfolio';
import SprintManagement from '@/components/SprintManagement';
import KanbanBoard from '@/components/KanbanBoard';
import PersonalTodoList from '@/components/PersonalTodoList';
import MasterDataManagement from '@/components/MasterDataManagement';
import UserRoleManagement from '@/components/UserRoleManagement';
import LoginForm from '@/components/LoginForm';

function MainAppContent() {
  const { currentUser, isLoggedIn, loading, hasMenuAccess } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSprintIdForKanban, setSelectedSprintIdForKanban] = useState<string>('');

  // Align activeTab with user's accessible menus upon login
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      if (hasMenuAccess('dashboard', 'view')) {
        setActiveTab('dashboard');
      } else if (hasMenuAccess('portfolio', 'view')) {
        setActiveTab('portfolio');
      } else if (hasMenuAccess('sprints', 'view')) {
        setActiveTab('sprints');
      } else if (hasMenuAccess('kanban', 'view')) {
        setActiveTab('kanban');
      } else {
        setActiveTab('kanban');
      }
    }
  }, [isLoggedIn, currentUser?.id]);

  const handleOpenKanbanForSprint = (sprintId: string) => {
    setSelectedSprintIdForKanban(sprintId);
    setActiveTab('kanban');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">
        กำลังโหลดข้อมูลการเข้าใช้ระบบ...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Sidebar Navigation */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Workspace Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'dashboard' && hasMenuAccess('dashboard', 'view') && <ExecutiveDashboard />}
          {activeTab === 'portfolio' && hasMenuAccess('portfolio', 'view') && <ProjectPortfolio />}
          {activeTab === 'sprints' && hasMenuAccess('sprints', 'view') && (
            <SprintManagement onOpenKanbanForSprint={handleOpenKanbanForSprint} />
          )}
          {activeTab === 'kanban' && hasMenuAccess('kanban', 'view') && (
            <KanbanBoard initialSprintId={selectedSprintIdForKanban} />
          )}
          {activeTab === 'masterdata' && hasMenuAccess('masterdata', 'view') && (
            <MasterDataManagement focusSection="master" />
          )}
          {activeTab === 'roles' && hasMenuAccess('roles', 'view') && <UserRoleManagement />}
          {activeTab === 'mytasks' && <PersonalTodoList />}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
