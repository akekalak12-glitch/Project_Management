'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { useAuth } from '@/lib/auth-context';
import { CheckSquare2, Calendar, CheckCircle2, Clock, Sparkles, Layers, ArrowRightLeft } from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  myTaskCategory: 'TODAY' | 'THIS_WEEK' | 'DONE';
  dueDate?: string;
  project?: { name: string; code: string };
}

export default function PersonalTodoList() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const fetchMyTasks = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/tasks?assigneeId=${currentUser.id}`);
      const data: any = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch personal tasks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [currentUser]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newCategory = over.id as 'TODAY' | 'THIS_WEEK' | 'DONE';

    // Optimistic Update
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const updatedStatus = newCategory === 'DONE' ? 'DONE' : t.status;
          return { ...t, myTaskCategory: newCategory, status: updatedStatus };
        }
        return t;
      })
    );

    // Show real-time sync notification
    if (newCategory === 'DONE') {
      setSyncStatusMsg('⚡ Real-time Sync: อัปเดตสถานะการ์ดบน Kanban Board เป็น "DONE" อัตโนมัติเรียบร้อยแล้ว!');
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myTaskCategory: newCategory }),
      });
    } catch (e) {
      console.error('Failed to update task category', e);
      fetchMyTasks();
    }
  };

  const categories: Array<{ id: 'TODAY' | 'THIS_WEEK' | 'DONE'; title: string; color: string; badge: string }> = [
    {
      id: 'TODAY',
      title: '🔥 งานวันนี้ (Today)',
      color: 'border-blue-500/30 bg-blue-950/20',
      badge: 'bg-blue-500/20 text-blue-400',
    },
    {
      id: 'THIS_WEEK',
      title: '📅 สัปดาห์นี้ (This Week)',
      color: 'border-indigo-500/30 bg-indigo-950/20',
      badge: 'bg-indigo-500/20 text-indigo-400',
    },
    {
      id: 'DONE',
      title: '✅ เสร็จแล้ว (Completed)',
      color: 'border-emerald-500/30 bg-emerald-950/20',
      badge: 'bg-emerald-500/20 text-emerald-400',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Drag & Drop Workspace
            </span>
            <span className="text-xs text-slate-400">สำหรับเจ้าหน้าที่ปฏิบัติงาน (53 คน)</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">Personal To-Do List (My Tasks)</h1>
          <p className="text-slate-400 text-xs mt-1">
            จัดลำดับความสำคัญของงานประจำวัน และเชื่อมโยงสถานะไปยัง Kanban Board หลักแบบ Real-time
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
          <div>
            <span className="text-xs font-bold text-white block">{currentUser?.name}</span>
            <span className="text-[11px] text-emerald-400 font-medium">งานของฉันทั้งหมด: {tasks.length} รายการ</span>
          </div>
        </div>
      </div>

      {/* Real-time Sync Alert Banner */}
      {syncStatusMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2 shadow-lg animate-pulse">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Drag & Drop Columns */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">กำลังโหลดงานของฉัน...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {categories.map((cat) => {
              const catTasks = tasks.filter((t) => t.myTaskCategory === cat.id);
              return (
                <div
                  key={cat.id}
                  id={cat.id}
                  className={`border ${cat.color} rounded-2xl p-5 min-h-[500px] flex flex-col space-y-4 shadow-sm`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{cat.title}</h3>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${cat.badge}`}>
                      {catTasks.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {catTasks.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        className={`bg-slate-900 border rounded-xl p-4 shadow-sm hover:border-emerald-500/50 cursor-grab active:cursor-grabbing transition-all space-y-2.5 ${
                          t.status === 'DONE' ? 'border-emerald-500/30 opacity-80' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-blue-400 bg-slate-800 px-2 py-0.5 rounded">
                            {t.project?.code || 'MY-TASK'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.status === 'DONE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            Kanban: {t.status}
                          </span>
                        </div>

                        <h4
                          className={`text-xs font-semibold text-white leading-snug ${
                            t.status === 'DONE' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {t.title}
                        </h4>

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" /> ครบกำหนด: 15 ส.ค.
                          </span>
                          {t.status === 'DONE' && (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ซิงค์แล้ว
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {catTasks.length === 0 && (
                      <div className="py-12 text-center text-slate-600 text-xs italic">
                        ลากการ์ดงานมาวางในโซนนี้เพื่อเปลี่ยนสถานะ
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}
    </div>
  );
}
