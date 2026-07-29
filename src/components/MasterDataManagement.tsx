'use client';

import React, { useState, useEffect } from 'react';
import { Database, Plus, Users, Building2, UserPlus, Shield, Edit2, Trash2, X } from 'lucide-react';
import { UserProfile, Section } from '@/lib/auth-context';

import { SEED_USERS, SEED_SECTIONS, SEED_ROLES } from '@/lib/data-store';

interface MasterDataProps {
  focusSection?: 'master' | 'roles';
}

export default function MasterDataManagement({ focusSection = 'master' }: MasterDataProps) {
  const [users, setUsers] = useState<UserProfile[]>(SEED_USERS);
  const [sections, setSections] = useState<Section[]>(SEED_SECTIONS);
  const [roles, setRoles] = useState<any[]>(SEED_ROLES);
  const [loading, setLoading] = useState(false);

  // Section Modal State
  const [showSecModal, setShowSecModal] = useState(false);
  const [editingSecId, setEditingSecId] = useState<string | null>(null);
  const [secName, setSecName] = useState('');
  const [secCode, setSecCode] = useState('');
  const [secDesc, setSecDesc] = useState('');

  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRoleId, setUserRoleId] = useState('');
  const [userSecId, setUserSecId] = useState('');

  const fetchData = async () => {
    try {
      const [resUsers, resSections, resRoles] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/sections'),
        fetch('/api/roles'),
      ]);
      if (resUsers.ok) {
        const dataUsers: any = await resUsers.json();
        if (dataUsers.success && Array.isArray(dataUsers.data) && dataUsers.data.length > 0) setUsers(dataUsers.data);
      }
      if (resSections.ok) {
        const dataSections: any = await resSections.json();
        if (dataSections.success && Array.isArray(dataSections.data) && dataSections.data.length > 0) setSections(dataSections.data);
      }
      if (resRoles.ok) {
        const dataRoles: any = await resRoles.json();
        if (dataRoles.success && Array.isArray(dataRoles.data) && dataRoles.data.length > 0) setRoles(dataRoles.data);
      }
    } catch (e) {
      console.warn('API fetch master data fallback to seeded D1 dataset', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Section Handlers
  const handleOpenAddSec = () => {
    setEditingSecId(null);
    setSecName('');
    setSecCode('');
    setSecDesc('');
    setShowSecModal(true);
  };

  const handleOpenEditSec = (sec: Section) => {
    setEditingSecId(sec.id);
    setSecName(sec.name);
    setSecCode(sec.code);
    setSecDesc(sec.description || '');
    setShowSecModal(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secName || !secCode) return;

    const newSecId = editingSecId || `sec-${Date.now()}`;
    const newSec: Section = {
      id: newSecId,
      name: secName,
      code: secCode,
      description: secDesc,
    };

    // Optimistic state update
    if (editingSecId) {
      setSections((prev) => prev.map((s) => (s.id === editingSecId ? newSec : s)));
    } else {
      setSections((prev) => [newSec, ...prev]);
    }
    setShowSecModal(false);

    try {
      const url = editingSecId ? `/api/sections/${editingSecId}` : '/api/sections';
      const method = editingSecId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: secName, code: secCode, description: secDesc }),
      });
      const data: any = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.warn('Backend API save section fallback to optimistic state', e);
    }
  };

  const handleDeleteSection = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบส่วนงาน "${name}" ใช่หรือไม่?`)) return;
    setSections((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/sections/${id}`, { method: 'DELETE' });
      const data: any = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.warn('Backend API delete section fallback to optimistic state', e);
    }
  };

  // User Handlers
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserRoleId(roles[roles.length - 1]?.id || roles[0]?.id || '732ce5ba-a573-4dd4-9543-a8989554c69a');
    setUserSecId(sections[0]?.id || '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRoleId(u.roleId);
    setUserSecId(u.sectionId || '');
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    const matchedRole = roles.find((r) => r.id === userRoleId) || roles[0] || { id: '732ce5ba-a573-4dd4-9543-a8989554c69a', title: 'เจ้าหน้าที่', key: 'STAFF', permissionLevel: 10 };
    const matchedSec = sections.find((s) => s.id === userSecId);

    const newUserObj: UserProfile = {
      id: editingUserId || `user-${Date.now()}`,
      name: userName,
      email: userEmail,
      roleId: matchedRole.id,
      role: matchedRole,
      sectionId: matchedSec?.id,
      section: matchedSec,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
    };

    // Optimistic state update - Updates UI immediately!
    if (editingUserId) {
      setUsers((prev) => prev.map((u) => (u.id === editingUserId ? newUserObj : u)));
    } else {
      setUsers((prev) => [newUserObj, ...prev]);
    }
    setShowUserModal(false);

    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          roleId: matchedRole.id,
          sectionId: userSecId || null,
        }),
      });
      const data: any = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.warn('Backend API save user fallback to optimistic state', e);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบเจ้าหน้าที่ "${name}" ใช่หรือไม่?`)) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data: any = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.warn('Backend API delete user fallback to optimistic state', e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            System Master Data Management
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">จัดการข้อมูลพื้นฐาน (User & Section CRUD)</h1>
          <p className="text-slate-400 text-xs mt-1">
            รองรับการ **เพิ่ม ลบ แก้ไข** ข้อมูลบุคลากร 60 คน กำหนดสายงาน และบริหารบทบาทตามสิทธิ์องค์กร
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddSec}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4 text-blue-400" /> เพิ่มส่วนงาน (Section)
          </button>
          <button
            onClick={handleOpenAddUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" /> เพิ่มพนักงาน/เจ้าหน้าที่ (User)
          </button>
        </div>
      </div>

      {/* Sections Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">รายการส่วนงานภายในองค์กร (Sections)</h2>
          </div>
          <span className="text-xs text-slate-400">({sections.length} ส่วนงาน)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {sections.map((sec) => (
            <div key={sec.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400 bg-slate-800 px-2 py-0.5 rounded">
                    {sec.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditSec(sec)}
                      className="p-1 text-slate-400 hover:text-amber-400 transition-all"
                      title="แก้ไข"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(sec.id, sec.name)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-all"
                      title="ลบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{sec.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{sec.description || 'ไม่มีคำอธิบาย'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">รายชื่อบุคลากรและสิทธิ์การใช้งาน ({users.length} คน)</h2>
          </div>
          <span className="text-xs text-slate-400">รองรับการ เพิ่ม แก้ไข และลบข้อมูลผู้ใช้งาน</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">บุคลากร</th>
                <th className="p-3">อีเมล</th>
                <th className="p-3">บทบาทสิทธิ์ (Role)</th>
                <th className="p-3">สังกัดส่วนงาน</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="p-3 flex items-center gap-3">
                    <img
                      src={u.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800"
                    />
                    <span className="font-semibold text-white">{u.name}</span>
                  </td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        u.role.key === 'SUPER_ADMIN'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : u.role.key === 'ADVISOR'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : u.role.key === 'PROJECT_OWNER'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : u.role.key === 'SCRUM_MASTER'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {u.role.title}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-medium">{u.section?.name || 'สังกัดกลาง'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-medium transition-all"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg font-medium transition-all"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Modal (Add/Edit) */}
      {showSecModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSection}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingSecId ? 'แก้ไขส่วนงาน (Edit Section)' : 'เพิ่มส่วนงานใหม่ (New Section)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSecModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">ชื่อส่วนงาน</label>
              <input
                type="text"
                required
                placeholder="เช่น ส่วนกลยุทธ์นวัตกรรมดิจิทัล"
                value={secName}
                onChange={(e) => setSecName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">รหัสส่วนงาน (Code)</label>
              <input
                type="text"
                required
                placeholder="เช่น STRAT"
                value={secCode}
                onChange={(e) => setSecCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">คำอธิบาย</label>
              <textarea
                placeholder="รายละเอียดขอบเขตงาน..."
                value={secDesc}
                onChange={(e) => setSecDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSecModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Modal (Add/Edit) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveUser}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingUserId ? 'แก้ไขข้อมูลเจ้าหน้าที่ (Edit Staff)' : 'เพิ่มเจ้าหน้าที่ใหม่ (New Staff)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                required
                placeholder="ระบุชื่อและนามสกุล..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">อีเมล</label>
              <input
                type="email"
                required
                placeholder="email@organization.go.th"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">บทบาทหน้าที่ (Role)</label>
                <select
                  value={userRoleId}
                  onChange={(e) => setUserRoleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">สังกัดส่วนงาน</label>
                <select
                  value={userSecId}
                  onChange={(e) => setUserSecId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- สังกัดกลาง --</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
