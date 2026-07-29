'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  Database,
  Users,
  ShieldAlert,
  CalendarDays,
  LogOut,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { currentUser, logout, hasMenuAccess, isExecutive, isAdvisor, isPM, isScrumMaster, isStaff } = useAuth();

  const allNavItems = [
    { id: 'dashboard', label: 'แดชบอร์ดภาพรวม', icon: LayoutDashboard },
    { id: 'portfolio', label: 'รายการโครงการ', icon: FolderKanban },
    { id: 'sprints', label: 'Sprint Board', icon: CalendarDays },
    { id: 'kanban', label: 'Kanban Board', icon: KanbanSquare },
    { id: 'masterdata', label: 'จัดการข้อมูลพื้นฐาน', icon: Database },
    { id: 'roles', label: 'การบริหารสิทธิ์ผู้ใช้งาน', icon: Users },
  ];

  // Filter visible menu items based on user role's view permissions
  const visibleNavItems = allNavItems.filter((item) => hasMenuAccess(item.id, 'view'));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 shadow-lg min-h-[calc(100vh-41px)]">
      <div>
        {/* User Profile Card with Logout Button */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
              alt="Avatar"
              className="w-10 h-10 rounded-full border border-blue-500/30 bg-slate-800 object-cover shrink-0"
            />
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{currentUser?.name || 'กำลังโหลด...'}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {currentUser?.role?.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {currentUser?.section?.name || 'สังกัดกลาง'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl border border-transparent hover:border-rose-800/40 transition-all cursor-pointer shrink-0"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Role-Filtered Navigation Menu */}
        <nav className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            เมนูหลัก ({currentUser?.role?.key || 'GUEST'})
          </p>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role View Badge Summary & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>มุมมองสิทธิ์บทบาท:</span>
          </div>
          <button
            onClick={logout}
            className="text-[10px] text-rose-400 hover:underline font-bold"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
        <p className="text-blue-300 font-semibold pl-5">
          {isExecutive && '👑 Executive View'}
          {isAdvisor && '🎓 Advisor View'}
          {isPM && '💼 PM View'}
          {isScrumMaster && '⚡ Scrum Master View'}
          {isStaff && '👷 Staff View'}
        </p>
      </div>
    </aside>
  );
}
