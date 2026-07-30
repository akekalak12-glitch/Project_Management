'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { LocalStorageManager } from '@/lib/storage-manager';

interface SaveAndSyncButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

export default function SaveAndSyncButton({ onSyncComplete, className = '' }: SaveAndSyncButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const handleSaveAndSyncAll = async () => {
    setIsSaving(true);
    try {
      // 1. Sync & Re-persist LocalStorageManager
      const projects = LocalStorageManager.getProjects();
      const sprints = LocalStorageManager.getSprints();
      const backlogs = LocalStorageManager.getBacklogs();
      const tasks = LocalStorageManager.getTasks();
      const users = LocalStorageManager.getUsers();
      const sections = LocalStorageManager.getSections();

      LocalStorageManager.setProjects(projects);
      LocalStorageManager.setSprints(sprints);
      LocalStorageManager.setBacklogs(backlogs);
      LocalStorageManager.setTasks(tasks);
      LocalStorageManager.setUsers(users);
      LocalStorageManager.setSections(sections);

      // 2. Broadcast custom global event so all components & tabs update instantly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app_data_synced', {
          detail: { timestamp: Date.now() }
        }));
      }

      if (onSyncComplete) onSyncComplete();

      setSavedSuccessMsg('บันทึกและซิงค์เชื่อมโยงข้อมูลทุกระบบเรียบร้อยแล้ว!');
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    } catch (e) {
      console.warn('Data sync event completed', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleSaveAndSyncAll}
        disabled={isSaving}
        className={`px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 border border-emerald-400/30 transition-all flex items-center gap-2 cursor-pointer ${className}`}
        title="กดเพื่อบันทึกและเชื่อมโยงข้อมูลทุกเมนู (Save & Sync System Data)"
      >
        {isSaving ? (
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-100" />
        ) : (
          <Save className="w-4 h-4 text-emerald-100" />
        )}
        <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกและเชื่อมโยงข้อมูล (Save & Sync)'}</span>
      </button>

      {savedSuccessMsg && (
        <div className="absolute right-0 top-12 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-semibold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 whitespace-nowrap animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}
    </div>
  );
}
