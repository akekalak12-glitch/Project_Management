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
import {
  Plus,
  Clock,
  ChevronDown,
  Calendar,
  UserPlus,
  ArrowRightLeft,
  X,
  Building2,
  Edit2,
  Trash2,
  Inbox,
  RefreshCw,
  FolderKanban,
  CheckSquare,
  Square,
  AlertCircle,
  Link2,
  Layers,
  Users,
} from 'lucide-react';
import SaveAndSyncButton from './SaveAndSyncButton';

interface TaskAssigneeItem {
  userId: string;
  user: { id: string; name: string; avatarUrl?: string };
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  projectId?: string;
  sprintId?: string;
  backlogItemId?: string;
  assigneeId?: string;
  assignee?: { id: string; name: string; avatarUrl?: string };
  assignees?: TaskAssigneeItem[];
  project?: { name: string; code: string };
  backlogItem?: { id: string; title: string; status: string };
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
  project?: { id: string; name: string; code: string };
}

interface KanbanBoardProps {
  initialSprintId?: string;
}

import { LocalStorageManager } from '@/lib/storage-manager';

export default function KanbanBoard({ initialSprintId }: KanbanBoardProps) {
  const { currentUser, isStaff, isExecutive, isAdvisor } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [backlogs, setBacklogs] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    const syncData = () => {
      setTasks(LocalStorageManager.getTasks());
      setSprints(LocalStorageManager.getSprints());
      setProjects(LocalStorageManager.getProjects());
      setBacklogs(LocalStorageManager.getBacklogs());
      setUsersList(LocalStorageManager.getUsers());
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

  const updateTasksState = (newTasks: TaskItem[] | ((prev: TaskItem[]) => TaskItem[])) => {
    setTasks((prev) => {
      const nextTasks = typeof newTasks === 'function' ? newTasks(prev) : newTasks;
      LocalStorageManager.setTasks(nextTasks);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app_data_synced'));
      }
      return nextTasks;
    });
  };

  // BOARD SELECTION
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedSprintId, setSelectedSprintId] = useState<string>(initialSprintId || 'ALL');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // New / Edit Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [modalProjectId, setModalProjectId] = useState<string>('');
  const [modalSprintId, setModalSprintId] = useState<string>('');
  const [modalBacklogId, setModalBacklogId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskStatus, setTaskStatus] = useState<'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'>('TODO');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  
  // Multiple Assignees State
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const fetchBoardData = async (manualRefresh = false) => {
    if (manualRefresh) setIsRefreshing(true);
    try {
      const [resTasks, resSprints, resProjects, resBacklogs, resUsers] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/sprints'),
        fetch('/api/projects'),
        fetch('/api/backlog'),
        fetch('/api/users'),
      ]);
      if (resTasks.ok) {
        const dataTasks: any = await resTasks.json();
        if (dataTasks.success && Array.isArray(dataTasks.data) && dataTasks.data.length > 0) setTasks(dataTasks.data);
      }
      if (resSprints.ok) {
        const dataSprints: any = await resSprints.json();
        if (dataSprints.success && Array.isArray(dataSprints.data) && dataSprints.data.length > 0) setSprints(dataSprints.data);
      }
      if (resProjects.ok) {
        const dataProjects: any = await resProjects.json();
        if (dataProjects.success && Array.isArray(dataProjects.data) && dataProjects.data.length > 0) setProjects(dataProjects.data);
      }
      if (resBacklogs.ok) {
        const dataBacklogs: any = await resBacklogs.json();
        if (dataBacklogs.success && Array.isArray(dataBacklogs.data) && dataBacklogs.data.length > 0) setBacklogs(dataBacklogs.data);
      }
      if (resUsers.ok) {
        const dataUsers: any = await resUsers.json();
        if (dataUsers.success && Array.isArray(dataUsers.data) && dataUsers.data.length > 0) setUsersList(dataUsers.data);
      }
    } catch (e) {
      console.warn('API fetch kanban board fallback to seeded D1 dataset', e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [currentUser, isStaff, initialSprintId]);

  // Update Task Status
  const updateTaskStatus = async (taskId: string, newColumnStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE') => {
    const targetTask = tasks.find((t) => t.id === taskId);
    updateTasksState((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, status: newColumnStatus } : t))
    );

    // Sync parent backlog item status
    if (targetTask?.backlogItemId) {
      const updatedBacklogStatus = newColumnStatus === 'DONE' ? 'SUCCESS' : (newColumnStatus === 'IN_PROGRESS' || newColumnStatus === 'IN_REVIEW' ? 'IN_PROGRESS' : 'PLANNED');
      setBacklogs((prevBacklogs) => {
        const nextBacklogs = prevBacklogs.map((b) => (b.id === targetTask.backlogItemId ? { ...b, status: updatedBacklogStatus } : b));
        LocalStorageManager.setBacklogs(nextBacklogs);
        return nextBacklogs;
      });
    }

    if (newColumnStatus === 'DONE') {
      setSyncStatusMsg('⚡ Real-time Sync: งานเสร็จสิ้นแล้ว! ระบบอัปเดต Backlog ต้นทางเป็น "SUCCESS" อัตโนมัติ!');
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } else {
      setSyncStatusMsg(`🔄 Real-time Sync: ปรับสถานะงานเป็น "${newColumnStatus}" ระบบอัปเดตความคืบหน้า Backlog ย้อนหลังอัตโนมัติ!`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app_data_synced'));
    }

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newColumnStatus }),
      });
    } catch (e) {
      console.error('Failed to update task status', e);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newColumnStatus = over.id as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    updateTaskStatus(taskId, newColumnStatus);
  };

  // Open Add Task Modal
  const handleOpenAddTaskModal = (defaultProjId?: string) => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskStatus('TODO');

    const initProjectId = defaultProjId || (selectedProjectId !== 'ALL' ? selectedProjectId : (projectsWithSprints[0]?.id || projects[0]?.id || ''));
    setModalProjectId(initProjectId);

    const projSprints = sprints.filter((s) => s.projectId === initProjectId);
    const initSprintId = selectedSprintId && selectedSprintId !== 'ALL' && projSprints.some((s) => s.id === selectedSprintId)
      ? selectedSprintId
      : (projSprints[0]?.id || sprints[0]?.id || '');
    setModalSprintId(initSprintId);

    const sprintBacklogs = backlogs.filter((b) => b.sprintId === initSprintId);
    setModalBacklogId(sprintBacklogs[0]?.id || '');

    const defaultUserId = currentUser?.id || usersList[0]?.id;
    setSelectedAssigneeIds(defaultUserId ? [defaultUserId] : []);

    setShowTaskModal(true);
  };

    // Cascading Project Change inside Modal
  const handleModalProjectChange = (projId: string) => {
    setModalProjectId(projId);
    const projSprints = sprints.filter((s) => s.projectId === projId);
    const firstSprintId = projSprints[0]?.id || '';
    setModalSprintId(firstSprintId);

    const sprintBacklogs = backlogs.filter((b) => b.sprintId === firstSprintId);
    setModalBacklogId(sprintBacklogs[0]?.id || 'AUTO_CREATE');
  };

  const handleModalSprintChange = (sprintId: string) => {
    setModalSprintId(sprintId);
    const sprintBacklogs = backlogs.filter((b) => b.sprintId === sprintId);
    setModalBacklogId(sprintBacklogs[0]?.id || 'AUTO_CREATE');
  };

  // Toggle Co-Assignee Checkbox Selection
  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Open Edit Task Modal
  const handleOpenEditTaskModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');

    const taskProjId = task.projectId || (sprints.find((s) => s.id === task.sprintId)?.projectId) || projects[0]?.id || '';
    setModalProjectId(taskProjId);
    setModalSprintId(task.sprintId || '');
    setModalBacklogId(task.backlogItemId || 'AUTO_CREATE');

    if (task.assignees && task.assignees.length > 0) {
      setSelectedAssigneeIds(task.assignees.map((a) => a.userId));
    } else if (task.assigneeId) {
      setSelectedAssigneeIds([task.assigneeId]);
    } else {
      setSelectedAssigneeIds([]);
    }

    setShowTaskModal(true);
  };

  // Save Task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      alert('โปรดกรอกชื่อการ์ดงาน (Task Title)');
      return;
    }

    if (selectedAssigneeIds.length === 0) {
      alert('โปรดเลือกเจ้าหน้าที่ผู้รับผิดชอบอย่างน้อย 1 คน');
      return;
    }

    const matchedProject = projects.find((p) => p.id === modalProjectId) || projects[0];
    const matchedAssignee = usersList.find((u) => selectedAssigneeIds.includes(u.id)) || usersList[0] || currentUser;

    let finalBacklogId = modalBacklogId;

    // Auto-generate a Backlog Item if modalBacklogId is empty or AUTO_CREATE
    if ((!modalBacklogId || modalBacklogId === 'AUTO_CREATE') && modalSprintId) {
      const parentSprint = sprints.find((s) => s.id === modalSprintId);
      const newBacklogItem = {
        id: `backlog-${Date.now()}`,
        sprintId: modalSprintId,
        title: taskTitle,
        description: taskDesc || `Backlog Item ที่สร้างจากการ์ดงาน Task`,
        priority: taskPriority,
        status: taskStatus === 'DONE' ? 'SUCCESS' : (taskStatus === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PLANNED'),
        assigneeId: matchedAssignee?.id,
        assignee: matchedAssignee,
        sprint: parentSprint ? { id: parentSprint.id, name: parentSprint.name, project: matchedProject } : undefined,
      };

      const updatedBacklogs = [newBacklogItem, ...backlogs];
      setBacklogs(updatedBacklogs);
      LocalStorageManager.setBacklogs(updatedBacklogs);
      finalBacklogId = newBacklogItem.id;
    }

    const newTaskObj: TaskItem = {
      id: editingTaskId || `task-${Date.now()}`,
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      status: taskStatus,
      dueDate: taskDueDate || undefined,
      projectId: modalProjectId || matchedProject?.id,
      sprintId: modalSprintId,
      backlogItemId: finalBacklogId && finalBacklogId !== 'AUTO_CREATE' ? finalBacklogId : undefined,
      assigneeId: matchedAssignee?.id,
      assignee: matchedAssignee,
      project: matchedProject ? { name: matchedProject.name, code: matchedProject.code } : undefined,
    };

    // Optimistic UI state update with LocalStorage sync
    if (editingTaskId) {
      updateTasksState((prev) => prev.map((t) => (t.id === editingTaskId ? newTaskObj : t)));
    } else {
      updateTasksState((prev) => [newTaskObj, ...prev]);
    }
    setShowTaskModal(false);

    try {
      const url = editingTaskId ? `/api/tasks/${editingTaskId}` : '/api/tasks';
      const method = editingTaskId ? 'PATCH' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          status: taskStatus,
          projectId: modalProjectId || undefined,
          sprintId: modalSprintId || undefined,
          backlogItemId: modalBacklogId || undefined,
          reporterId: currentUser?.id,
          assigneeIds: selectedAssigneeIds,
        }),
      });
    } catch (e: any) {
      console.warn('Backend API save task fallback to optimistic state', e);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`คุณต้องการลบการ์ดงาน "${title}" ใช่หรือไม่?`)) return;
    updateTasksState((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend API delete task fallback to optimistic state', e);
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

  // Strictly filter projects to ONLY those that have at least one Sprint created
  const projectsWithSprints = accessibleProjects.filter((p) =>
    sprints.some((s) => s.projectId === p.id)
  );

  const accessibleProjectIds = new Set(projectsWithSprints.map((p) => p.id));

  // Sprints available under selected Project and accessible projects
  const availableSprints = sprints.filter(
    (s) =>
      (isFullAccessUser || accessibleProjectIds.has(s.projectId)) &&
      (selectedProjectId === 'ALL' || s.projectId === selectedProjectId)
  );

  const activeSprintObj = sprints.find((s) => s.id === selectedSprintId);

  // Filter project members / users for the selected project
  const currentProjectObj = projects.find((p) => p.id === modalProjectId);
  const eligibleUsers = currentProjectObj?.members?.length > 0
    ? currentProjectObj.members.map((m: any) => m.user)
    : usersList;

  const modalSprints = sprints.filter((s) => !modalProjectId || s.projectId === modalProjectId);
  const modalBacklogs = backlogs.filter((b) => {
    if (!modalSprintId) return false;
    const matchSprintId = b.sprintId === modalSprintId || b.sprint?.id === modalSprintId;
    const matchedSprintObj = sprints.find((s) => s.id === modalSprintId);
    const matchSprintName = matchedSprintObj && b.sprint?.name === matchedSprintObj.name;
    return matchSprintId || matchSprintName;
  });

  // Projects list to render (Only projects with at least one Sprint created)
  const displayProjects = selectedProjectId === 'ALL'
    ? projectsWithSprints
    : projectsWithSprints.filter((p) => p.id === selectedProjectId);

  const columns: Array<{ id: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'; title: string; color: string }> = [
    { id: 'TODO', title: '📋 To Do (งานที่จะทำ)', color: 'border-slate-700 bg-slate-900/50' },
    { id: 'IN_PROGRESS', title: '⚡ In Progress (กำลังทำ)', color: 'border-blue-500/30 bg-blue-950/20' },
    { id: 'IN_REVIEW', title: '🔍 In Review (รอตรวจ)', color: 'border-amber-500/30 bg-amber-950/20' },
    { id: 'DONE', title: '✅ Done (เสร็จแล้ว)', color: 'border-emerald-500/30 bg-emerald-950/20' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Board Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Separated Project-by-Project Kanban View
            </span>
            <span className="text-xs text-slate-400">
              {isStaff ? 'แสดงงานที่ได้รับมอบหมาย' : 'แยกแสดงบอร์ด Kanban ตามแต่ละโครงการ'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">Agile Kanban Board (แยกคอลัมน์ตามแต่ละโครงการ)</h1>
          <p className="text-slate-400 text-xs mt-1">
            แสดงผลการ์ดงาน Task **แยกเป็นบอร์ดของแต่ละโครงการชัดเจน** ไม่นำมารวมกันให้สับสน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Global Save & Sync Button */}
          <SaveAndSyncButton />

          {/* Refresh Sprint Data Button */}
          <button
            onClick={() => fetchBoardData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="รีเฟรชข้อมูลทั้งหมด"
          >
            <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรชข้อมูล</span>
          </button>

          {/* Create Task Button */}
          <button
            onClick={() => handleOpenAddTaskModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + สร้างการ์ดงานใหม่ (Add Task)
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2 shadow-lg animate-pulse">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Strict Sprint & Project Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Building2 className="w-4 h-4 text-blue-400" /> โครงการ:
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedSprintId('ALL');
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 py-2 px-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">-- แสดงเฉพาะโครงการที่มี Sprint ({projectsWithSprints.length}) --</option>
              {projectsWithSprints.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 shrink-0 bg-blue-500/10 text-blue-300 px-3 py-1.5 rounded-xl border border-blue-500/20">
              <Calendar className="w-4 h-4 text-blue-400" /> กรอง Sprint:
            </span>

            <div className="relative w-full md:w-80">
              <select
                value={selectedSprintId}
                onChange={(e) => setSelectedSprintId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-2 pl-3 pr-8 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none truncate"
              >
                <option value="ALL">-- แสดงทุก Sprint ของโครงการ --</option>
                {availableSprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.project?.code || 'โครงการ'}] {s.name} ({s.cadence === 'WEEKLY' ? 'สัปดาห์' : 'เดือน'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-3 pointer-events-none text-blue-400" />
            </div>
          </div>
        </div>

        {selectedProjectId === 'ALL' && (
          <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl text-xs text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <FolderKanban className="w-4 h-4 text-purple-400" />
              <span>แสดงผลเฉพาะโครงการที่มีการสร้าง Sprint แล้ว ({projectsWithSprints.length} โครงการ):</span>
            </div>
            <span className="text-[11px] text-slate-400">บอร์ดแต่ละโครงการจะถูกแยกเป็นคอลัมน์ของตัวเองอย่างชัดเจน</span>
          </div>
        )}
      </div>

      {/* Separated Project-by-Project Kanban Boards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">กำลังโหลด Kanban Board...</div>
      ) : displayProjects.length === 0 ? (
        <div className="bg-slate-900 border border-amber-500/30 p-10 rounded-3xl text-center space-y-3">
          <Calendar className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">ยังไม่มีโครงการใดที่เริ่มสร้างตาราง Sprint</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            หน้า Kanban Board จะแสดงผลเฉพาะโครงการที่มีการกำหนด <strong className="text-blue-400">Sprint</strong> แล้วเท่านั้น
            หากต้องการสร้างการ์ดงาน โปรดไปที่เมนู <strong className="text-blue-400">"Sprint Board"</strong> เพื่อเริ่มสร้าง Sprint ให้กับโครงการก่อน
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {displayProjects.map((proj) => {
            const projSprints = sprints.filter((s) => s.projectId === proj.id);
            const projSprintIds = new Set(projSprints.map((s) => s.id));

            // Backlogs associated with this project's sprints
            const projBacklogs = backlogs.filter(
              (b) =>
                projSprintIds.has(b.sprintId) &&
                (selectedSprintId === 'ALL' || b.sprintId === selectedSprintId)
            );

            // Filter tasks strictly for this project
            const projTasks = tasks.filter((t) => {
              const matchesProj = t.projectId === proj.id || t.project?.name === proj.name;
              const matchesSprint = selectedSprintId === 'ALL' || t.sprintId === selectedSprintId;
              return matchesProj && matchesSprint;
            });

            // Convert Backlog Items without explicit tasks into synthetic Kanban cards
            const existingBacklogIdsInTasks = new Set(projTasks.map((t) => t.backlogItemId).filter(Boolean));
            const syntheticBacklogCards: TaskItem[] = projBacklogs
              .filter((b) => !existingBacklogIdsInTasks.has(b.id))
              .map((b) => {
                let mappedStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' = 'TODO';
                if (b.status === 'IN_PROGRESS') mappedStatus = 'IN_PROGRESS';
                if (b.status === 'FLEXIBLE_REVISED') mappedStatus = 'IN_REVIEW';
                if (b.status === 'SUCCESS') mappedStatus = 'DONE';

                const parentSprint = projSprints.find((s) => s.id === b.sprintId);

                return {
                  id: `backlog-derived-${b.id}`,
                  title: `📌 ${b.title}`,
                  description: b.description || `รายการ Backlog จาก ${parentSprint?.name || 'Sprint'}`,
                  priority: (b.priority as any) || 'MEDIUM',
                  status: mappedStatus,
                  projectId: proj.id,
                  sprintId: b.sprintId,
                  backlogItemId: b.id,
                  assigneeId: b.assigneeId || b.assignee?.id || proj.ownerId,
                  assignee: b.assignee || proj.owner,
                  project: { name: proj.name, code: proj.code },
                  backlogItem: { title: b.title },
                };
              });

            const allProjectCards = [...projTasks, ...syntheticBacklogCards];

            return (
              <div key={proj.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                {/* Project Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                      {proj.code?.substring(0, 3) || 'PRJ'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{proj.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {proj.code}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        ผู้รับผิดชอบโครงการ: <strong className="text-slate-200">{proj.owner?.name || 'ยังไม่ระบุ'}</strong> • สมาชิก ({proj.members?.length || 0} คน)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-semibold">
                      {allProjectCards.length} Cards ({projBacklogs.length} Backlogs)
                    </span>
                    <button
                      onClick={() => handleOpenAddTaskModal(proj.id)}
                      className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-semibold text-xs rounded-xl border border-blue-500/30 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + เพิ่ม Task ในโครงการนี้
                    </button>
                  </div>
                </div>

                {/* 4 Kanban Columns per Project */}
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {columns.map((col) => {
                      const colTasks = projTasks.filter((t) => t.status === col.id);
                      return (
                        <div
                          key={col.id}
                          id={col.id}
                          className={`border ${col.color} rounded-2xl p-4 min-h-[350px] flex flex-col space-y-3 shadow-sm`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{col.title}</h4>
                            <span className="text-xs font-black bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                              {colTasks.length}
                            </span>
                          </div>

                          <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                            {colTasks.map((t) => {
                              const coAssignees = t.assignees && t.assignees.length > 0
                                ? t.assignees.map((a) => a.user)
                                : (t.assignee ? [t.assignee] : []);

                              return (
                                <div
                                  key={t.id}
                                  draggable
                                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-500/50 cursor-grab active:cursor-grabbing transition-all space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                        t.priority === 'URGENT'
                                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                          : t.priority === 'HIGH'
                                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                                      }`}
                                    >
                                      {t.priority}
                                    </span>

                                    {/* Quick Keying Status Dropdown */}
                                    <select
                                      value={t.status}
                                      onChange={(e) =>
                                        updateTaskStatus(t.id, e.target.value as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE')
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className={`text-[10px] font-extrabold px-2 py-1 rounded border appearance-none cursor-pointer focus:outline-none ${
                                        t.status === 'DONE'
                                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                          : t.status === 'IN_PROGRESS'
                                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                          : t.status === 'IN_REVIEW'
                                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                          : 'bg-slate-800 text-slate-300 border-slate-700'
                                      }`}
                                    >
                                      <option value="TODO">📋 To Do</option>
                                      <option value="IN_PROGRESS">⚡ In Progress</option>
                                      <option value="IN_REVIEW">🔍 In Review</option>
                                      <option value="DONE">✅ Done</option>
                                    </select>
                                  </div>

                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="text-xs font-semibold text-white leading-snug">{t.title}</h5>

                                    {/* Edit & Delete Action Buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleOpenEditTaskModal(t)}
                                        className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded transition-all"
                                        title="แก้ไขการ์ดงาน Task"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(t.id, t.title)}
                                        className="p-1 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded transition-all"
                                        title="ลบการ์ดงาน Task"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {t.description && (
                                    <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                                  )}

                                  {/* Backlog Item Relation Badge */}
                                  {t.backlogItem && (
                                    <div className="text-[10px] text-purple-300 font-medium bg-purple-950/40 p-2 rounded-lg border border-purple-800/40 space-y-0.5">
                                      <span className="text-purple-400 font-bold flex items-center gap-1 text-[9px] uppercase">
                                        <Link2 className="w-3 h-3" /> ผูกกับ Backlog:
                                      </span>
                                      <span className="font-semibold block truncate">{t.backlogItem.title}</span>
                                    </div>
                                  )}

                                  {/* Multi-Assignee Avatars & Names */}
                                  <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-slate-400 text-[11px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                      <div className="flex -space-x-1.5 overflow-hidden">
                                        {coAssignees.map((u) => (
                                          <img
                                            key={u.id}
                                            src={u.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                                            alt={u.name}
                                            title={u.name}
                                            className="w-5 h-5 rounded-full border border-slate-900 bg-slate-800 object-cover"
                                          />
                                        ))}
                                      </div>
                                      <span className="font-semibold text-slate-200 text-[10px] truncate max-w-[100px]">
                                        {coAssignees.map((u) => u.name).join(', ') || 'ยังไม่ระบุ'}
                                      </span>
                                    </div>
                                    <span className="flex items-center gap-1 text-slate-500 text-[10px] shrink-0">
                                      <Clock className="w-3 h-3" /> 15 ส.ค.
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {colTasks.length === 0 && (
                              <div className="py-8 text-center text-slate-600 text-xs italic">ไม่มีการ์ดงานในช่องนี้</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DndContext>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveTask}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingTaskId ? 'แก้ไขการ์ดงาน Task' : 'สร้างการ์ดงาน Task ใหม่'}
                </h3>
                <span className="text-[11px] text-blue-400 font-semibold block mt-0.5">
                  เลือกผู้รับผิดชอบงานร่วมกันหลายคนในโครงการ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Select Project */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                1. เลือกโครงการ (Project):
              </label>
              <select
                value={modalProjectId}
                onChange={(e) => handleModalProjectChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white font-medium rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {projectsWithSprints.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Select Sprint */}
            <div>
              <label className="text-xs font-bold text-blue-400 block mb-1">
                2. เลือก Sprint ของโครงการ:
              </label>
              <select
                value={modalSprintId}
                onChange={(e) => handleModalSprintChange(e.target.value)}
                className="w-full bg-slate-950 border border-blue-500/40 text-blue-200 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {modalSprints.length === 0 && <option value="">-- ไม่พบ Sprint ในโครงการนี้ --</option>}
                {modalSprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.cadence === 'WEEKLY' ? 'สัปดาห์' : 'เดือน'}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Select Backlog */}
            <div>
              <label className="text-xs font-bold text-purple-400 mb-1 flex items-center justify-between">
                <span>3. เลือก Backlog ใน Sprint นี้ ({modalBacklogs.length} รายการ):</span>
                <span className="text-[10px] text-purple-300 font-semibold">
                  {modalBacklogs.length === 0 ? '✨ สร้าง Backlog อัตโนมัติ' : 'เลือก Backlog หรือสร้างใหม่'}
                </span>
              </label>
              <select
                value={modalBacklogId}
                onChange={(e) => setModalBacklogId(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/40 text-purple-200 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-md"
              >
                <option value="AUTO_CREATE">
                  ➕ สร้างเป็น Backlog Item ใหม่ใน Sprint นี้โดยอัตโนมัติ
                </option>
                {modalBacklogs.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.title} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Task Card Title */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">ชื่อการ์ดงาน (Task Title)</label>
              <input
                type="text"
                required
                placeholder="ระบุหัวข้องานที่ต้องให้เจ้าหน้าที่ปฏิบัติ..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Multi-Assignee Checkbox List */}
            <div>
              <label className="text-xs font-bold text-blue-300 block mb-1 flex items-center justify-between">
                <span>👥 มอบหมายเจ้าหน้าที่ปฏิบัติงานร่วมกัน (เลือกได้หลายคน):</span>
                <span className="text-[10px] text-slate-400">เลือกแล้ว {selectedAssigneeIds.length} คน</span>
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                {eligibleUsers.map((u: any) => {
                  const isChecked = selectedAssigneeIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleAssignee(u.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all ${
                        isChecked
                          ? 'bg-blue-950/40 border-blue-500/40 text-white'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                          alt={u.name}
                          className="w-5 h-5 rounded-full border border-slate-700"
                        />
                        <span className="text-xs font-medium">{u.name}</span>
                      </div>
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">ความสำคัญ (Priority)</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">สถานะ</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>

            {/* Task Due Date Calendar Picker */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> วันกำหนดส่งงาน (Due Date):
              </label>
              <input
                type="date"
                style={{ colorScheme: 'dark' }}
                value={taskDueDate}
                onClick={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">รายละเอียดงานเพิ่มเติม</label>
              <textarea
                rows={3}
                placeholder="คำอธิบายขั้นตอนปฏิบัติงานเพิ่มเติม..."
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all"
              >
                {editingTaskId ? 'บันทึกการแก้ไข Task' : 'บันทึกสร้างการ์ดงาน Task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
