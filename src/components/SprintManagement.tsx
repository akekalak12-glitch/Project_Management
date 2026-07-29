'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Calendar,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  Building2,
  FolderKanban,
  Edit2,
  Trash2,
  ListTodo,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BacklogItem {
  id: string;
  sprintId: string;
  title: string;
  description?: string;
  priority: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'SUCCESS' | 'FLEXIBLE_REVISED';
  startDate?: string;
  endDate?: string;
  sprint?: {
    id: string;
    name: string;
    cadence: 'WEEKLY' | 'MONTHLY';
    startDate: string;
    endDate: string;
  };
  kanbanTasks?: any[];
}

interface SprintItem {
  id: string;
  name: string;
  goal?: string;
  cadence: 'WEEKLY' | 'MONTHLY';
  startDate: string;
  endDate: string;
  status: string;
  projectId: string;
  project?: { id: string; name: string; code: string; startDate?: string };
  backlogItems?: BacklogItem[];
}

interface PeriodSlot {
  slotNumber: number;
  label: string;
  startDate: string;
  endDate: string;
}

interface SprintManagementProps {
  onOpenKanbanForSprint?: (sprintId: string) => void;
}

export default function SprintManagement({ onOpenKanbanForSprint }: SprintManagementProps) {
  const { currentUser, canCreateProject, isExecutive, isAdvisor } = useAuth();
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedCadence, setSelectedCadence] = useState<'ALL' | 'WEEKLY' | 'MONTHLY'>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down expanded Sprint rows state
  const [expandedSprintIds, setExpandedSprintIds] = useState<string[]>([]);

  // New/Edit Sprint Modal State
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintCadence, setSprintCadence] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [sprintProjectId, setSprintProjectId] = useState('');
  const [sprintStartDate, setSprintStartDate] = useState('');
  const [sprintEndDate, setSprintEndDate] = useState('');
  const [sprintStatus, setSprintStatus] = useState('ACTIVE');

  // Backlog Modal State (Add/Edit) with Period Slot Selector
  const [showBacklogModal, setShowBacklogModal] = useState(false);
  const [editingBacklogId, setEditingBacklogId] = useState<string | null>(null);
  const [backlogTitle, setBacklogTitle] = useState('');
  const [backlogDesc, setBacklogDesc] = useState('');
  const [backlogPriority, setBacklogPriority] = useState('MEDIUM');
  const [backlogStartDate, setBacklogStartDate] = useState('');
  const [backlogEndDate, setBacklogEndDate] = useState('');
  const [targetSprintId, setTargetSprintId] = useState('');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);

  const fetchData = async () => {
    try {
      const uParam = currentUser?.id ? `?userId=${currentUser.id}` : '';
      const [resSprints, resProjects, resBacklogs] = await Promise.all([
        fetch(`/api/sprints${uParam}`),
        fetch(`/api/projects${uParam}`),
        fetch('/api/backlog'),
      ]);
      const dataSprints: any = await resSprints.json();
      const dataProjects: any = await resProjects.json();
      const dataBacklogs: any = await resBacklogs.json();

      if (dataSprints.success) {
        setSprints(dataSprints.data);
        setExpandedSprintIds(dataSprints.data.map((s: any) => s.id));
      }
      if (dataProjects.success) setProjects(dataProjects.data);
      if (dataBacklogs.success) setBacklogItems(dataBacklogs.data);
    } catch (e) {
      console.error('Failed to fetch Sprint Board data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  // Helper to calculate total number of slots (Weeks or Calendar Months) in a Sprint
  const calculateSprintSlots = (sprint: SprintItem): PeriodSlot[] => {
    const slots: PeriodSlot[] = [];
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);

    if (sprint.cadence === 'WEEKLY') {
      let currStart = new Date(start);
      let slotIndex = 1;

      while (currStart <= end) {
        let currEnd = new Date(currStart);
        currEnd.setDate(currEnd.getDate() + 6);
        if (currEnd > end) currEnd = new Date(end);

        const startStr = currStart.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
        const endStr = currEnd.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });

        slots.push({
          slotNumber: slotIndex,
          label: `สัปดาห์ที่ ${slotIndex} (${startStr} - ${endStr})`,
          startDate: currStart.toISOString().slice(0, 10),
          endDate: currEnd.toISOString().slice(0, 10),
        });

        slotIndex++;
        currStart = new Date(currEnd);
        currStart.setDate(currStart.getDate() + 1);
      }
    } else {
      // MONTHLY cadence: Count actual Calendar Months directly (1st day to last day of each month)
      const startYear = start.getFullYear();
      const startMonth = start.getMonth(); // 0-indexed
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();

      const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      let slotIndex = 1;

      for (let i = 0; i < Math.max(1, totalMonths); i++) {
        const mDate = new Date(startYear, startMonth + i, 1);
        const mEnd = new Date(startYear, startMonth + i + 1, 0); // Last day of month

        const monthName = mDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

        const yearStr = mDate.getFullYear();
        const monthStr = String(mDate.getMonth() + 1).padStart(2, '0');
        const lastDayVal = String(mEnd.getDate()).padStart(2, '0');

        const firstDayStr = `${yearStr}-${monthStr}-01`;
        const lastDayStr = `${yearStr}-${monthStr}-${lastDayVal}`;

        slots.push({
          slotNumber: slotIndex,
          label: `เดือนที่ ${slotIndex} - ${monthName} (1 ${mDate.toLocaleDateString('th-TH', { month: 'short' })} - ${mEnd.getDate()} ${mEnd.toLocaleDateString('th-TH', { month: 'short' })})`,
          startDate: firstDayStr,
          endDate: lastDayStr,
        });

        slotIndex++;
      }
    }

    if (slots.length === 0) {
      slots.push({
        slotNumber: 1,
        label: `สัปดาห์ที่ 1 (${start.toLocaleDateString('th-TH')} - ${end.toLocaleDateString('th-TH')})`,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      });
    }

    return slots;
  };

  const toggleDrillDownSprint = (sprintId: string) => {
    setExpandedSprintIds((prev) =>
      prev.includes(sprintId) ? prev.filter((id) => id !== sprintId) : [...prev, sprintId]
    );
  };

  // Sprint Handlers
  const handleOpenAddSprint = () => {
    setEditingSprintId(null);
    setSprintName('');
    setSprintGoal('');
    setSprintCadence('WEEKLY');
    setSprintProjectId(projects[0]?.id || '');
    const todayStr = new Date().toISOString().slice(0, 10);
    const endStr = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setSprintStartDate(todayStr);
    setSprintEndDate(endStr);
    setSprintStatus('ACTIVE');
    setShowSprintModal(true);
  };

  const handleOpenEditSprint = (s: SprintItem) => {
    setEditingSprintId(s.id);
    setSprintName(s.name);
    setSprintGoal(s.goal || '');
    setSprintCadence(s.cadence);
    setSprintProjectId(s.projectId || projects[0]?.id || '');
    setSprintStartDate(new Date(s.startDate).toISOString().slice(0, 10));
    setSprintEndDate(new Date(s.endDate).toISOString().slice(0, 10));
    setSprintStatus(s.status || 'ACTIVE');
    setShowSprintModal(true);
  };

  const handleSaveSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim() || !sprintStartDate || !sprintEndDate) return;
    const targetProjId = sprintProjectId || projects[0]?.id;

    try {
      const url = editingSprintId ? `/api/sprints/${editingSprintId}` : '/api/sprints';
      const method = editingSprintId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sprintName,
          goal: sprintGoal,
          cadence: sprintCadence,
          projectId: targetProjId,
          startDate: sprintStartDate,
          endDate: sprintEndDate,
          status: sprintStatus,
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setShowSprintModal(false);
        fetchData();
      } else {
        alert(`ไม่สามารถบันทึก Sprint ได้: ${data.error || 'โปรดตรวจสอบข้อมูล'}`);
      }
    } catch (e: any) {
      console.error('Failed to save sprint', e);
      alert('เกิดข้อผิดพลาดในการบันทึก Sprint');
    }
  };

  const handleDeleteSprint = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบ Sprint "${name}" และ Backlog ทั้งหมดใน Sprint นี้ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/sprints/${id}`, { method: 'DELETE' });
      const data: any = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.error('Failed to delete sprint', e);
    }
  };

  // Backlog Handlers
  const handleOpenAddBacklog = (sprintId?: string, slotIdx: number = 0) => {
    setEditingBacklogId(null);
    setBacklogTitle('');
    setBacklogDesc('');
    setBacklogPriority('MEDIUM');

    const selectedSprint = sprints.find((s) => s.id === sprintId) || sprints[0];
    if (selectedSprint) {
      setTargetSprintId(selectedSprint.id);
      const slots = calculateSprintSlots(selectedSprint);
      const targetIdx = slotIdx < slots.length ? slotIdx : 0;
      if (slots.length > 0) {
        setSelectedSlotIndex(targetIdx);
        setBacklogStartDate(slots[targetIdx].startDate);
        setBacklogEndDate(slots[targetIdx].endDate);
      }
    }
    setShowBacklogModal(true);
  };

  const handleSprintChangeForBacklog = (sprintId: string) => {
    setTargetSprintId(sprintId);
    const selectedSprint = sprints.find((s) => s.id === sprintId);
    if (selectedSprint) {
      const slots = calculateSprintSlots(selectedSprint);
      if (slots.length > 0) {
        setSelectedSlotIndex(0);
        setBacklogStartDate(slots[0].startDate);
        setBacklogEndDate(slots[0].endDate);
      }
    }
  };

  const handleSlotChangeForBacklog = (slotIdx: number, slots: PeriodSlot[]) => {
    setSelectedSlotIndex(slotIdx);
    if (slots[slotIdx]) {
      setBacklogStartDate(slots[slotIdx].startDate);
      setBacklogEndDate(slots[slotIdx].endDate);
    }
  };

  const handleOpenEditBacklog = (b: BacklogItem) => {
    setEditingBacklogId(b.id);
    setBacklogTitle(b.title);
    setBacklogDesc(b.description || '');
    setBacklogPriority(b.priority);
    setBacklogStartDate(b.startDate ? new Date(b.startDate).toISOString().slice(0, 10) : '');
    setBacklogEndDate(b.endDate ? new Date(b.endDate).toISOString().slice(0, 10) : '');
    setTargetSprintId(b.sprintId);
    setShowBacklogModal(true);
  };

  const handleSaveBacklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backlogTitle || !targetSprintId) return;

    try {
      const url = editingBacklogId ? `/api/backlog/${editingBacklogId}` : '/api/backlog';
      const method = editingBacklogId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: backlogTitle,
          description: backlogDesc,
          priority: backlogPriority,
          sprintId: targetSprintId,
          startDate: backlogStartDate || undefined,
          endDate: backlogEndDate || undefined,
          status: editingBacklogId ? 'FLEXIBLE_REVISED' : 'PLANNED',
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setShowBacklogModal(false);
        fetchData();
      }
    } catch (e) {
      console.error('Failed to save backlog item', e);
    }
  };

  const handleDeleteBacklog = async (id: string, title: string) => {
    if (!confirm(`คุณต้องการลบ Backlog Item "${title}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/backlog/${id}`, { method: 'DELETE' });
      const data: any = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.error('Failed to delete backlog item', e);
    }
  };

  const isFullAccessUser = isExecutive || isAdvisor;

  const accessibleProjects = isFullAccessUser
    ? projects
    : projects.filter((p) =>
        p.ownerId === currentUser?.id ||
        p.owner?.id === currentUser?.id ||
        p.members?.some((m: any) => m.userId === currentUser?.id || m.user?.id === currentUser?.id)
      );

  const accessibleProjectIds = new Set(accessibleProjects.map((p) => p.id));

  const filteredSprints = sprints.filter((s) => {
    const isAccessible = isFullAccessUser || accessibleProjectIds.has(s.projectId);
    const matchesCadence = selectedCadence === 'ALL' || s.cadence === selectedCadence;
    const matchesProject = selectedProjectId === 'ALL' || s.project?.id === selectedProjectId;
    return isAccessible && matchesCadence && matchesProject;
  });

  const activeSprintForBacklog = sprints.find((s) => s.id === targetSprintId);
  const activeSprintSlots = activeSprintForBacklog ? calculateSprintSlots(activeSprintForBacklog) : [];

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Horizontal Timeline Multi-Column Board
            </span>
            <span className="text-xs text-slate-400">({sprints.length} Sprints ในระบบ)</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              🎯 ความก้าวหน้า Backlog รวม (Success Rate): {backlogItems.length > 0 ? Math.round((backlogItems.filter((b) => b.status === 'SUCCESS').length / backlogItems.length) * 100) : 0}% ({backlogItems.filter((b) => b.status === 'SUCCESS').length}/{backlogItems.length} Success)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">บอร์ดบริหาร Backlog แยกคอลัมน์ (เรียงจากซ้ายไปขวา ตามสัปดาห์/เดือน)</h1>
          <p className="text-slate-400 text-xs mt-1">
            คำนวณวัดความก้าวหน้าโครงการจากอัตราการดำเนินการ **Success ของ Backlog** ในแต่ละ Sprint
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canCreateProject && (
            <button
              onClick={handleOpenAddSprint}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
            >
              <Calendar className="w-4 h-4 text-blue-400" /> + ตั้ง Sprint ใหม่
            </button>
          )}
          <button
            onClick={() => handleOpenAddBacklog()}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> + เพิ่ม Backlog
          </button>
        </div>
      </div>

      {/* Matrix Controls & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5 text-purple-400" /> มุมมองบอร์ด:
          </span>

          <button
            onClick={() => setSelectedCadence('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCadence === 'ALL'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            📊 แสดงบอร์ดคอลัมน์ทั้งหมด
          </button>

          <button
            onClick={() => setSelectedCadence('WEEKLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCadence === 'WEEKLY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            📅 คอลัมน์รายสัปดาห์ (Weekly Columns)
          </button>

          <button
            onClick={() => setSelectedCadence('MONTHLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCadence === 'MONTHLY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            🗓️ คอลัมน์รายเดือน (Monthly Columns)
          </button>
        </div>

        {/* Filter by Project */}
        <div className="w-full md:w-72">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-2 px-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">-- แสดงทุกโครงการที่คุณมีสิทธิ์ ({accessibleProjects.length}) --</option>
            {accessibleProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizontal Multi-Column Timeline Board (ซ้ายไปขวา ตามสัปดาห์/เดือน) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">บอร์ดแสดงผล Backlog แยกตามคอลัมน์สัปดาห์ / เดือน (ซ้ายไปขวา)</h2>
          </div>
          <span className="text-xs text-slate-400">({filteredSprints.length} Sprints ในระบบ)</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">กำลังโหลดบอร์ดคอลัมน์...</div>
        ) : (
          <div className="space-y-8">
            {filteredSprints.map((s) => {
              const sprintBacklogs = backlogItems.filter((b) => b.sprintId === s.id);
              const totalBacklogCount = sprintBacklogs.length;
              const successCount = sprintBacklogs.filter((b) => b.status === 'SUCCESS').length;
              const isExpanded = expandedSprintIds.includes(s.id);
              const sprintSlots = calculateSprintSlots(s);

              return (
                <div
                  key={s.id}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md transition-all space-y-4"
                >
                  {/* Sprint Header Row Banner */}
                  <div
                    onClick={() => toggleDrillDownSprint(s.id)}
                    className="p-5 bg-slate-900/60 hover:bg-slate-800/60 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              s.cadence === 'WEEKLY'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {s.cadence === 'WEEKLY' ? `📅 รอบรายสัปดาห์ (แยกเป็น ${sprintSlots.length} คอลัมน์สัปดาห์)` : `🗓️ รอบรายเดือน (แยกเป็น ${sprintSlots.length} คอลัมน์เดือน)`}
                          </span>
                          {s.project && (
                            <span className="text-[10px] font-mono text-blue-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {s.project.code} • {s.project.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white">{s.name}</h3>
                        <p className="text-xs text-slate-400">
                          <strong className="text-slate-300">กรอบเวลา Sprint:</strong>{' '}
                          {new Date(s.startDate).toLocaleDateString('th-TH')} -{' '}
                          {new Date(s.endDate).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">ความคืบหน้า Backlog</span>
                        <span className="text-sm font-extrabold text-emerald-400">
                          {successCount}/{totalBacklogCount} รายการสำเร็จ
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                        {canCreateProject && (
                          <>
                            <button
                              onClick={() => handleOpenEditSprint(s)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                              title="แก้ไข Sprint"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSprint(s.id, s.name)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg"
                              title="ลบ Sprint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenAddBacklog(s.id)}
                          className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold rounded-xl border border-purple-500/30 transition-all"
                        >
                          + เพิ่ม Backlog
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Column Layout (From Left to Right based on Week or Month Slots) */}
                  {isExpanded && (
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-flow-col auto-cols-fr gap-4 overflow-x-auto pb-4">
                        {sprintSlots.map((slot, idx) => {
                          // Filter Backlogs that belong to this Week/Month Slot
                          const slotBacklogs = sprintBacklogs.filter((b) => {
                            if (!b.startDate) return idx === 0;
                            const bStartStr = new Date(b.startDate).toISOString().slice(0, 10);
                            return bStartStr === slot.startDate;
                          });

                          return (
                            <div
                              key={idx}
                              className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col space-y-3 min-w-[280px] shadow-sm hover:border-purple-500/30 transition-all"
                            >
                              {/* Column Header */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                                <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 truncate">
                                  📍 {slot.label}
                                </h4>
                                <span className="text-[10px] font-black bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 shrink-0">
                                  {slotBacklogs.length}
                                </span>
                              </div>

                              {/* Backlog Item Cards in this Column */}
                              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-0.5">
                                {slotBacklogs.map((b) => (
                                  <div
                                    key={b.id}
                                    className={`bg-slate-950 border rounded-xl p-3.5 space-y-2.5 shadow-sm transition-all hover:border-purple-500/40 ${
                                      b.status === 'SUCCESS'
                                        ? 'border-emerald-500/40 bg-emerald-950/10'
                                        : 'border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                          b.status === 'SUCCESS'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : b.status === 'IN_PROGRESS'
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : b.status === 'FLEXIBLE_REVISED'
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}
                                      >
                                        {b.status}
                                      </span>

                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                        {b.priority}
                                      </span>
                                    </div>

                                    <h5 className="text-xs font-bold text-white leading-snug">{b.title}</h5>

                                    {b.description && (
                                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                        {b.description}
                                      </p>
                                    )}

                                    {/* Action buttons on card */}
                                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                                      <span className="text-slate-500 font-mono">
                                        {b.startDate ? new Date(b.startDate).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }) : 'ไม่ระบุ'}
                                      </span>

                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleOpenEditBacklog(b)}
                                          className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded transition-all"
                                          title="แก้ไข Backlog"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBacklog(b.id, b.title)}
                                          className="p-1 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded transition-all"
                                          title="ลบ Backlog"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {slotBacklogs.length === 0 && (
                                  <div className="py-8 text-center text-slate-600 text-xs italic">
                                    ไม่มี Backlog ในสล็อตนี้
                                  </div>
                                )}
                              </div>

                              {/* Column Footer Quick Add Button */}
                              <button
                                onClick={() => handleOpenAddBacklog(s.id, idx)}
                                className="w-full py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all mt-auto"
                              >
                                <Plus className="w-3.5 h-3.5" /> + เพิ่ม Backlog สล็อตนี้
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSprints.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs italic">
                ไม่พบข้อมูลตาราง Sprint ในรอบเวลานี้
              </div>
            )}
          </div>
        )}
      </div>

      {/* New/Edit Sprint Modal */}
      {showSprintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSprint}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingSprintId ? 'แก้ไข Sprint (Edit Sprint)' : 'สร้าง Sprint ใหม่ (New Sprint)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSprintModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">สังกัดโครงการ</label>
              <select
                value={sprintProjectId}
                onChange={(e) => setSprintProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">ชื่อ Sprint</label>
              <input
                type="text"
                required
                placeholder="เช่น Sprint 32 (รายสัปดาห์) หรือ Sprint Q3/Aug (รายเดือน)"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">เป้าหมายของ Sprint (Goal)</label>
              <input
                type="text"
                placeholder="เป้าหมายหลักในการส่งมอบงาน..."
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">รอบเวลา (Sprint Cadence)</label>
                <select
                  value={sprintCadence}
                  onChange={(e) => setSprintCadence(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="WEEKLY">📅 รายสัปดาห์ (Weekly)</option>
                  <option value="MONTHLY">🗓️ รายเดือน (Monthly)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">สถานะ Sprint</label>
                <select
                  value={sprintStatus}
                  onChange={(e) => setSprintStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PLANNING">PLANNING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">วันเริ่มต้น</label>
                <input
                  type="date"
                  required
                  value={sprintStartDate}
                  onChange={(e) => setSprintStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">วันสิ้นสุด</label>
                <input
                  type="date"
                  required
                  value={sprintEndDate}
                  onChange={(e) => setSprintEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSprintModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all"
              >
                บันทึก Sprint
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Backlog Item Modal */}
      {showBacklogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBacklog}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingBacklogId ? 'แก้ไข Sprint Backlog Item' : 'เพิ่ม Sprint Backlog Item ใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBacklogModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">สังกัด Sprint</label>
              <select
                value={targetSprintId}
                onChange={(e) => handleSprintChangeForBacklog(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.cadence === 'WEEKLY' ? 'สัปดาห์' : 'เดือน'}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DYNAMIC SLOT SELECTOR */}
            {activeSprintSlots.length > 0 && (
              <div>
                <label className="text-xs font-bold text-purple-400 block mb-1">
                  🎯 เลือกคอลัมน์สัปดาห์/เดือน ที่ต้องการบรรจุ Backlog นี้:
                </label>
                <select
                  value={selectedSlotIndex}
                  onChange={(e) => handleSlotChangeForBacklog(Number(e.target.value), activeSprintSlots)}
                  className="w-full bg-purple-950/60 border border-purple-500/40 text-purple-200 font-bold py-2.5 px-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-md"
                >
                  {activeSprintSlots.map((slot, idx) => (
                    <option key={idx} value={idx}>
                      📍 {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">เป้าหมาย Backlog (Title)</label>
              <input
                type="text"
                required
                placeholder="เช่น จัดทำ API Gateway 5 เส้นทาง..."
                value={backlogTitle}
                onChange={(e) => setBacklogTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">วันเริ่ม (Auto Column)</label>
                <input
                  type="date"
                  required
                  value={backlogStartDate}
                  onChange={(e) => setBacklogStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">วันสิ้นสุด (Auto Column)</label>
                <input
                  type="date"
                  required
                  value={backlogEndDate}
                  onChange={(e) => setBacklogEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">ความสำคัญ (Priority)</label>
              <select
                value={backlogPriority}
                onChange={(e) => setBacklogPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">รายละเอียดเพิ่มเติม</label>
              <textarea
                rows={3}
                placeholder="เกณฑ์ความสำเร็จ (Acceptance Criteria)..."
                value={backlogDesc}
                onChange={(e) => setBacklogDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBacklogModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all"
              >
                บันทึก Backlog
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
