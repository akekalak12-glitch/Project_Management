'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, UserCheck, ChevronDown, Sparkles, Lock } from 'lucide-react';

export default function RoleSwitcher() {
  const { currentUser, usersList, switchUserById, loading, isExecutive, isAdvisor } = useAuth();

  const isFullAccessUser = isExecutive || isAdvisor;

  // Pick standard demo accounts for quick role switching
  const superAdmin = usersList.find((u) => u.role?.key === 'SUPER_ADMIN');
  const advisor = usersList.find((u) => u.role?.key === 'ADVISOR');
  const projectOwner = usersList.find((u) => u.role?.key === 'PROJECT_OWNER');
  const scrumMaster = usersList.find((u) => u.role?.key === 'SCRUM_MASTER');
  const staff = usersList.find((u) => u.role?.key === 'STAFF');

  const quickRoles = [
    { label: '👑 ผู้อำนวยการกอง (Super Admin)', user: superAdmin },
    { label: '🎓 ผู้เชี่ยวชาญ (Advisor)', user: advisor },
    { label: '💼 ผู้อำนวยการส่วน (PO)', user: projectOwner },
    { label: '⚡ หัวหน้าฝ่าย (Scrum Master)', user: scrumMaster },
    { label: '👷 เจ้าหน้าที่ (Staff #1)', user: staff },
  ];

  // Non-Executive/Advisor users see only their own logged-in identity badge
  if (!isFullAccessUser) {
    return (
      <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 font-medium">
          <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-xl font-bold shadow-sm">
            <Lock className="w-3.5 h-3.5 text-blue-400" /> สิทธิ์ใช้งานปัจจุบันของคุณ: {currentUser?.name}
          </span>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold">
            บทบาท: {currentUser?.role?.title} ({currentUser?.role?.key})
          </span>
        </div>

        <div className="text-slate-400 text-[11px] font-medium flex items-center gap-2">
          <span>สังกัดงาน:</span>
          <strong className="text-white bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 font-bold">
            {currentUser?.section?.name || 'สังกัดกลาง'}
          </strong>
        </div>
      </div>
    );
  }

  // Executive and Advisor roles see full role switching simulator bar
  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2 font-medium">
        <span className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1 rounded-md text-white font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> RBAC Executive Session Simulator
        </span>
        <span className="text-slate-400 hidden sm:inline">สลับสิทธิ์การใช้งานจริงจาก 60 คนเพื่อทดสอบมุมมอง:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick Access Buttons */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
          {quickRoles.map((qr, idx) => (
            <button
              key={idx}
              disabled={!qr.user || loading}
              onClick={() => qr.user && switchUserById(qr.user.id)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer ${
                currentUser?.id === qr.user?.id
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {qr.label}
            </button>
          ))}
        </div>

        {/* Full 60 Users Dropdown Selector */}
        <div className="relative flex items-center">
          <select
            value={currentUser?.id || ''}
            onChange={(e) => switchUserById(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 py-1 pl-2.5 pr-8 rounded-lg appearance-none font-medium hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="" disabled>
              -- เลือกผู้ใช้งานจาก 60 คน --
            </option>
            {usersList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role?.title}) [{u.section?.code || 'N/A'}]
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-slate-400" />
        </div>
      </div>
    </div>
  );
}
