'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check, Shield } from 'lucide-react';
import { UserProfile } from '@/lib/auth-context';

interface TeamFormationModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TeamFormationModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSaved,
}: TeamFormationModalProps) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadTeamData() {
      setLoading(true);
      try {
        const [resUsers, resMembers] = await Promise.all([
          fetch('/api/users'),
          fetch(`/api/projects/${projectId}/members`),
        ]);
        const dataUsers = await resUsers.json();
        const dataMembers = await resMembers.json();

        if (dataUsers.success) setAllUsers(dataUsers.data);
        if (dataMembers.success) {
          const memberUserIds = dataMembers.data.map((m: any) => m.userId);
          setSelectedUserIds(memberUserIds);
        }
      } catch (e) {
        console.error('Failed to load team formation data', e);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [projectId, isOpen]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds, projectRole: 'MEMBER' }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      }
    } catch (e) {
      console.error('Failed to save team members', e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.section?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ตั้งทีมงานสำหรับโครงการ</h3>
              <p className="text-xs text-blue-400 font-medium">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเจ้าหน้าที่, อีเมล หรือส่วนงาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span>เจ้าหน้าที่ที่ถูกเลือก: <strong className="text-blue-400">{selectedUserIds.length}</strong> คน</span>
            <span>จากทั้งหมด {allUsers.length} คนในองค์กร</span>
          </div>

          {/* User List with Checkboxes */}
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">กำลังโหลดรายชื่อพนักงาน...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUserSelection(u.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/40 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800"
                      />
                      <div>
                        <h5 className="text-xs font-semibold">{u.name}</h5>
                        <p className="text-[11px] text-slate-400">
                          {u.role.title} • {u.section?.name || 'สังกัดกลาง'}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
          >
            ยกเลิก
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all"
          >
            {saving ? 'กำลังบันทึกทีม...' : 'บันทึกทีมงาน'}
          </button>
        </div>
      </div>
    </div>
  );
}
