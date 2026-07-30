'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  Edit2,
  Trash2,
  Save,
  CheckSquare,
  Square,
  Building2,
  X,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile, Section } from '@/lib/auth-context';
import { SEED_ROLES } from '@/lib/data-store';
import { LocalStorageManager } from '@/lib/storage-manager';
import SaveAndSyncButton from './SaveAndSyncButton';

interface RoleItem {
  id: string;
  key: string;
  title: string;
  permissionLevel: number;
  menuPermissions?: string; // JSON string
}

const MENU_LIST = [
  { id: 'dashboard', name: '1. แดชบอร์ดภาพรวม' },
  { id: 'portfolio', name: '2. รายการโครงการ' },
  { id: 'sprints', name: '3. Sprint Board' },
  { id: 'kanban', name: '4. Kanban Board' },
  { id: 'masterdata', name: '5. จัดการข้อมูลพื้นฐาน' },
  { id: 'roles', name: '6. การบริหารสิทธิ์ผู้ใช้งาน' },
];

export default function UserRoleManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Password Visibility Toggle State per User ID
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  // Active Selected Role for Permission Matrix
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissionMatrix, setPermissionMatrix] = useState<{
    [menuId: string]: { view: boolean; edit: boolean };
  }>({});

  // User Add/Edit Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('123456');
  const [userRoleId, setUserRoleId] = useState('');
  const [userSecId, setUserSecId] = useState('');

  useEffect(() => {
    const syncData = () => {
      setUsers(LocalStorageManager.getUsers());
      setSections(LocalStorageManager.getSections());
      setRoles(SEED_ROLES);
      if (!selectedRoleId && SEED_ROLES.length > 0) {
        setSelectedRoleId(SEED_ROLES[0].id);
        initMatrixForRole(SEED_ROLES[0]);
      }
      setLoading(false);
    };

    syncData();
    if (typeof window !== 'undefined') {
      window.addEventListener('app_data_synced', syncData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app_data_synced', syncData);
      }
    };
  }, []);

  // Initialize Permission Matrix for Selected Role
  const initMatrixForRole = (role: RoleItem) => {
    let parsed: any = {};
    if (role.menuPermissions) {
      try {
        parsed = JSON.parse(role.menuPermissions);
      } catch (e) {
        parsed = {};
      }
    }

    const newMatrix: { [menuId: string]: { view: boolean; edit: boolean } } = {};
    MENU_LIST.forEach((menu) => {
      newMatrix[menu.id] = {
        view: parsed[menu.id]?.view ?? true,
        edit: parsed[menu.id]?.edit ?? (role.permissionLevel >= 80),
      };
    });
    setPermissionMatrix(newMatrix);
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId);
    const roleObj = roles.find((r) => r.id === roleId);
    if (roleObj) {
      initMatrixForRole(roleObj);
    }
  };

  const togglePermission = (menuId: string, type: 'view' | 'edit') => {
    setPermissionMatrix((prev) => {
      const current = prev[menuId] || { view: true, edit: false };
      const updated = { ...current, [type]: !current[type] };

      // If view is unchecked, edit must also be unchecked
      if (type === 'view' && !updated.view) {
        updated.edit = false;
      }
      // If edit is checked, view must automatically be checked
      if (type === 'edit' && updated.edit) {
        updated.view = true;
      }

      return { ...prev, [menuId]: updated };
    });
  };

  const handleSavePermissionMatrix = async () => {
    if (!selectedRoleId) return;

    try {
      const res = await fetch(`/api/roles/${selectedRoleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuPermissions: JSON.stringify(permissionMatrix) }),
      });
      const data: any = await res.json();
      if (data.success) {
        setSyncMsg('✅ บันทึกการกำหนดสิทธิ์เมนูสำหรับบทบาทสำเร็จเรียบร้อยแล้ว!');
        setTimeout(() => setSyncMsg(null), 4000);
        fetchData();
      } else {
        alert(`ไม่สามารถบันทึกสิทธิ์ได้: ${data.error}`);
      }
    } catch (e) {
      console.error('Failed to save role permissions', e);
    }
  };

  const toggleShowPassword = (userId: string) => {
    setShowPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Open Add User Modal
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('123456');
    setUserRoleId(roles[roles.length - 1]?.id || '');
    setUserSecId(sections[0]?.id || '');
    setShowUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPassword(u.password || '123456');
    setUserRoleId(u.roleId);
    setUserSecId(u.sectionId || '');
    setShowUserModal(true);
  };

  // Save User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail || !userRoleId) return;

    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          password: userPassword,
          roleId: userRoleId,
          sectionId: userSecId || null,
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setShowUserModal(false);
        fetchData();
      } else {
        alert(`ไม่สามารถบันทึกข้อมูลผู้ใช้ได้: ${data.error}`);
      }
    } catch (e) {
      console.error('Failed to save user', e);
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบเจ้าหน้าที่ "${name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data: any = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.error('Failed to delete user', e);
    }
  };

  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              User Credentials & Granular Menu Access Matrix
            </span>
            <span className="text-xs text-slate-400">({users.length} พนักงานในระบบ)</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">การบริหารสิทธิ์ผู้ใช้งาน (User & Role Permission Management)</h1>
          <p className="text-slate-400 text-xs mt-1">
            จัดการบัญชีผู้ใช้งาน **รหัสผ่าน (Password)** และ **กำหนดสิทธิ์การมองเห็นและแก้ไขย่อยของแต่ละเมนู**
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <SaveAndSyncButton />
          <button
            onClick={handleOpenAddUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> + เพิ่มบัญชีผู้ใช้งานใหม่
          </button>
        </div>
      </div>

      {/* Sync Success Status Banner */}
      {syncMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2 shadow-lg animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncMsg}</span>
        </div>
      )}

      {/* SECTION 1: Granular Menu Permission Matrix (กำหนดสิทธิ์เมนู: มองเห็น & แก้ไขได้) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white">กำหนดสิทธิ์การเข้าถึงและการแก้ไขรายเมนู (Menu Permission Matrix)</h2>
              <p className="text-slate-400 text-xs">เลือกบทบาท (Role) เพื่อกำหนดว่าเห็นเมนูใดและแก้ไขข้อมูลเมนูใดได้บ้าง</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300 shrink-0">เลือกบทบาท (Role):</span>
            <select
              value={selectedRoleId}
              onChange={(e) => handleRoleSelect(e.target.value)}
              className="bg-slate-950 border border-purple-500/40 text-purple-200 font-bold py-2 px-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-md"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.key})
                </option>
              ))}
            </select>

            <button
              onClick={handleSavePermissionMatrix}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4" /> 💾 บันทึกสิทธิ์เมนู
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">รายการหน้าเมนูหลัก</th>
                <th className="py-3 px-4 text-center">👁️ สิทธิ์การมองเห็น (View)</th>
                <th className="py-3 px-4 text-center">✏️ สิทธิ์การแก้ไข (Edit)</th>
                <th className="py-3 px-4 text-right">สถานะสิทธิ์ปฏิบัติการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {MENU_LIST.map((menu) => {
                const isView = permissionMatrix[menu.id]?.view ?? true;
                const isEdit = permissionMatrix[menu.id]?.edit ?? false;

                return (
                  <tr key={menu.id} className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{menu.name}</span>
                    </td>

                    {/* View Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(menu.id, 'view')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isView
                            ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                            : 'bg-slate-950/40 text-slate-500 border-slate-800'
                        }`}
                      >
                        {isView ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                        <span>{isView ? 'เห็นเมนูนี้' : 'ซ่อนเมนู'}</span>
                      </button>
                    </td>

                    {/* Edit Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(menu.id, 'edit')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isEdit
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-950/40 text-slate-500 border-slate-800'
                        }`}
                      >
                        {isEdit ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                        <span>{isEdit ? 'แก้ไขได้' : 'อ่านอย่างเดียว (Read Only)'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${
                          isView && isEdit
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isView
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isView && isEdit ? 'Full Access' : isView ? 'View Only' : 'No Access'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: User Accounts & Password Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">บัญชีผู้ใช้งานและรหัสผ่านเข้าสู่ระบบ (User Accounts & Passwords)</h2>
          </div>
          <span className="text-xs text-slate-400">({users.length} รายชื่อ)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">อีเมล (Username)</th>
                <th className="py-3 px-4">รหัสผ่าน (Password)</th>
                <th className="py-3 px-4">บทบาท (Role)</th>
                <th className="py-3 px-4">ส่วนงาน (Section)</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                    <img
                      src={u.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800 object-cover"
                    />
                    <span>{u.name}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>

                  {/* Password Display with Show/Hide Toggle */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs">
                        {showPasswords[u.id] ? u.password || '123456' : '••••••••'}
                      </span>
                      <button
                        onClick={() => toggleShowPassword(u.id)}
                        className="text-slate-400 hover:text-white transition-all"
                        title={showPasswords[u.id] ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showPasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {u.role?.title}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">{u.section?.name || 'สังกัดกลาง'}</td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-all"
                        title="แก้ไขข้อมูลและตั้งรหัสผ่านใหม่"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg transition-all"
                        title="ลบบัญชีผู้ใช้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal with Password Field */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveUser}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingUserId ? 'แก้ไขข้อมูลผู้ใช้ & ตั้งรหัสผ่าน' : 'เพิ่มบัญชีผู้ใช้งานใหม่'}
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
              <label className="text-xs font-medium text-slate-300 block mb-1">ชื่อ - นามสกุล</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">อีเมล (Username สำหรับล็อกอิน)</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-blue-400 block mb-1">🔑 รหัสผ่าน (Password)</label>
              <input
                type="text"
                required
                placeholder="ระบุรหัสผ่านใช้งาน..."
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full bg-slate-950 border border-blue-500/40 font-mono font-bold text-blue-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">บทบาท (Role)</label>
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
                <label className="text-xs font-medium text-slate-300 block mb-1">ส่วนงาน (Section)</label>
                <select
                  value={userSecId}
                  onChange={(e) => setUserSecId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- ไม่ระบุ (สังกัดกลาง) --</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
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
                {editingUserId ? 'บันทึกแก้ไขข้อมูล' : 'สร้างบัญชีผู้ใช้'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
