'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Building2, FolderKanban, BarChart3, Lock, Users, Gauge } from 'lucide-react';

// Individual KPI dashboard excludes staff belonging to this section (the
// standards/oversight section itself, whose staff assign and review work
// rather than being measured by it).
const KPI_EXCLUDED_SECTION_NAME = 'กองมาตรฐานการประเมินราคาทรัพย์สิน';

const TASK_STATUS_CHIP: Record<string, string> = {
  DONE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  IN_REVIEW: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  TODO: 'bg-slate-800 text-slate-400 border-slate-700',
};
const TASK_PRIORITY_CHIP: Record<string, string> = {
  URGENT: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  MEDIUM: 'bg-slate-800 text-slate-400 border-slate-700',
  LOW: 'bg-slate-800 text-slate-500 border-slate-700',
};

interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  status: string;
  ownerId?: string;
  owner?: { id: string; name: string; avatarUrl?: string };
  members?: Array<{ userId: string; projectRole?: string; user?: { id: string; name: string; avatarUrl?: string } }>;
  section: { name: string; code: string };
  startDate?: string;
  endDate?: string;
  progress?: number;
}

// Weighted "success score" (0-100) for a person based on the current status
// of every task assigned to them — used by the team/task assignment table.
function formatDeadline(dueDate: string | null | undefined): string {
  if (!dueDate) return 'ไม่ได้กำหนดเวลา';
  return new Date(dueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Points awarded per completed task, by priority — this is what makes
// volume AND importance matter: someone assigned many URGENT/HIGH tasks
// who finishes them on time accumulates points fast and reaches the top
// of the 0-100 scale, while someone with few, low-priority tasks caps
// out lower even at 100% completion.
const KPI_PRIORITY_POINTS: Record<string, number> = {
  URGENT: 25,
  HIGH: 20,
  MEDIUM: 15,
  LOW: 10,
};
const KPI_LATE_MULTIPLIER = 0.5;

// Individual KPI: assigned / done / on-time-done counts plus a combined
// 0-100 performance score, for one person across ALL of their tasks
// (org-wide, not scoped to one project). Each DONE task contributes
// points based on its priority (URGENT/HIGH tasks are worth more than
// LOW/MEDIUM ones); a task finished on or before its due date earns full
// points, one finished late earns half, and a task with no due date at
// all gets full credit (nothing to have been late against). Points are
// summed — not averaged — across every assigned task and capped at 100,
// so a person handling a large, important workload and delivering it on
// time scores the highest, exactly matching how this KPI should reward
// volume + importance + timeliness together rather than treating a
// single easy task done on time the same as a heavy, urgent workload.
function computeIndividualKpi(tasksForPerson: any[]) {
  const assignedCount = tasksForPerson.length;
  const doneCount = tasksForPerson.filter((t) => t.status === 'DONE').length;
  const onTimeCount = tasksForPerson.filter(
    (t) => t.status === 'DONE' && (!t.dueDate || new Date(t.updatedAt) <= new Date(t.dueDate))
  ).length;

  if (assignedCount === 0) {
    return { assignedCount, doneCount, onTimeCount, performanceScore: null as number | null };
  }

  const totalPoints = tasksForPerson.reduce((acc, t) => {
    if (t.status !== 'DONE') return acc;
    const basePoints = KPI_PRIORITY_POINTS[t.priority] ?? KPI_PRIORITY_POINTS.MEDIUM;
    const onTime = !t.dueDate || new Date(t.updatedAt) <= new Date(t.dueDate);
    return acc + (onTime ? basePoints : basePoints * KPI_LATE_MULTIPLIER);
  }, 0);
  const performanceScore = Math.min(100, Math.round(totalPoints));

  return { assignedCount, doneCount, onTimeCount, performanceScore };
}

export default function ExecutiveDashboard() {
  const { currentUser, isExecutive, isAdvisor } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [allSprints, setAllSprints] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Always read from the live database rather than a local cache, so this
  // dashboard reflects real current state after edits made elsewhere.
  const loadData = async () => {
    try {
      const [resPrj, resTasks, resSprints, resUsers] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/sprints'),
        fetch('/api/users'),
      ]);
      if (resPrj.ok) {
        const dataPrj: any = await resPrj.json();
        if (dataPrj.success && Array.isArray(dataPrj.data)) setProjects(dataPrj.data);
      }
      if (resTasks.ok) {
        const dataTasks: any = await resTasks.json();
        if (dataTasks.success && Array.isArray(dataTasks.data)) setAllTasks(dataTasks.data);
      }
      if (resSprints.ok) {
        const dataSprints: any = await resSprints.json();
        if (dataSprints.success && Array.isArray(dataSprints.data)) setAllSprints(dataSprints.data);
      }
      if (resUsers.ok) {
        const dataUsers: any = await resUsers.json();
        if (dataUsers.success && Array.isArray(dataUsers.data)) setAllUsers(dataUsers.data);
      }
    } catch (e) {
      console.error('Failed to load executive dashboard data', e);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('app_data_synced', loadData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app_data_synced', loadData);
      }
    };
  }, []);

  const isFullAccessUser = isExecutive || isAdvisor;

  const accessibleProjects = isFullAccessUser
    ? projects
    : projects.filter((p) =>
        p.ownerId === currentUser?.id ||
        p.owner?.id === currentUser?.id ||
        p.members?.some((m: any) => m.userId === currentUser?.id || m.user?.id === currentUser?.id)
      );

  const accessibleProjectIds = new Set(accessibleProjects.map((p) => p.id));

  const totalProjects = accessibleProjects.length;
  const inProgressProjects = accessibleProjects.filter((p) => p.status === 'IN_PROGRESS').length;

  // Task & Sprint metrics
  const accessibleProjectIds2 = new Set(accessibleProjects.map((p) => p.id));
  const accessibleTasks = allTasks.filter((t: any) => accessibleProjectIds2.has(t.projectId));
  const totalTasks = accessibleTasks.length;
  const doneTasks = accessibleTasks.filter((t: any) => t.status === 'DONE').length;
  const overallTaskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const accessibleSprints = allSprints.filter((s: any) => accessibleProjectIds2.has(s.projectId));
  const totalSprints = accessibleSprints.length;
  // People without assigned tasks (checks both the primary assigneeId and
  // the full multi-assignee list, since a task can have several co-assignees)
  const assignedUserIds = new Set<string>();
  accessibleTasks.forEach((t: any) => {
    if (t.assigneeId) assignedUserIds.add(t.assigneeId);
    (t.assignees || []).forEach((a: any) => {
      const uid = a.userId || a.user?.id;
      if (uid) assignedUserIds.add(uid);
    });
  });
  // ยกเว้น ผอ.กองมาตรฐานการประเมินราคาทรัพย์สิน (หัวหน้าส่วนงานที่กำกับดูแล ไม่ใช่ผู้ปฏิบัติงาน)
  // และผู้เชี่ยวชาญ (ที่ปรึกษา ไม่ได้รับมอบหมาย Task โดยตรง) ออกจากการนับ "คนที่ไม่มี Task"
  const unassignedPeople = allUsers.filter((u: any) => {
    if (assignedUserIds.has(u.id)) return false;
    const isAdvisor = u.role?.key === 'ADVISOR';
    const isStandardsSectionDirector =
      u.role?.key === 'SUPER_ADMIN' && u.section?.name === KPI_EXCLUDED_SECTION_NAME;
    return !isAdvisor && !isStandardsSectionDirector;
  }).length;

  // Team & Task Assignment Summary: for every accessible project, list its
  // lead (owner) plus every team member, the real tasks assigned to each of
  // them in that project, and a weighted success score derived from those
  // tasks' current status.
  const teamAssignmentRows = accessibleProjects.flatMap((prj: any) => {
    const memberMap = new Map<string, { user: any; roleLabel: string }>();
    if (prj.owner) {
      memberMap.set(prj.owner.id, { user: prj.owner, roleLabel: 'หัวหน้าโครงการ' });
    }
    (prj.members || []).forEach((m: any) => {
      if (!m.user || memberMap.has(m.user.id)) return;
      memberMap.set(m.user.id, {
        user: m.user,
        roleLabel: m.projectRole === 'OWNER' ? 'หัวหน้าโครงการ' : 'ทีมงาน',
      });
    });

    return Array.from(memberMap.values()).map(({ user, roleLabel }) => {
      const personTasks = allTasks.filter(
        (t: any) =>
          t.projectId === prj.id &&
          (t.assigneeId === user.id ||
            (t.assignees || []).some((a: any) => a.userId === user.id || a.user?.id === user.id))
      );
      return {
        projectId: prj.id,
        projectName: prj.name,
        projectCode: prj.code,
        userId: user.id,
        userName: user.name,
        avatarUrl: user.avatarUrl,
        roleLabel,
        tasks: personTasks,
      };
    });
  });

  // Flatten the per-person summary above into one row per task (or one
  // placeholder row for people with none), so "ใคร" (who) and the task's
  // own fields render in clean, separate, aligned columns instead of being
  // stacked/crammed together inside a single cell. Project/person cells use
  // rowSpan so they only print once per group.
  const projectRowSpanTotals = new Map<string, number>();
  teamAssignmentRows.forEach((row) => {
    const n = Math.max(row.tasks.length, 1);
    projectRowSpanTotals.set(row.projectId, (projectRowSpanTotals.get(row.projectId) || 0) + n);
  });

  const teamTaskDetailRows = teamAssignmentRows.flatMap((row, rowIdx) => {
    const prevRow = teamAssignmentRows[rowIdx - 1];
    const isFirstRowOfProject = !prevRow || prevRow.projectId !== row.projectId;
    const personRowSpan = Math.max(row.tasks.length, 1);
    const items = row.tasks.length > 0 ? row.tasks : [null];

    return items.map((t: any, i: number) => ({
      key: `${row.projectId}-${row.userId}-${t ? t.id : 'none'}-${i}`,
      projectId: row.projectId,
      projectName: row.projectName,
      projectCode: row.projectCode,
      projectRowSpan: isFirstRowOfProject && i === 0 ? (projectRowSpanTotals.get(row.projectId) ?? 1) : 0,
      userId: row.userId,
      userName: row.userName,
      roleLabel: row.roleLabel,
      personRowSpan: i === 0 ? personRowSpan : 0,
      task: t,
    }));
  });

  // Individual KPI: every user in the system (org-wide, not limited to the
  // projects rendered above) except staff belonging to the excluded
  // section, each measured against ALL of their assigned tasks.
  const kpiRows = allUsers
    .filter((u: any) => u.section?.name !== KPI_EXCLUDED_SECTION_NAME)
    .map((u: any) => {
      // ผอ.ส่วน (PROJECT_OWNER) และหัวหน้าฝ่าย (SCRUM_MASTER) มักถูกใส่เป็นผู้ร่วมงาน
      // (co-assignee) ในแทบทุก Task ของโครงการที่ตนดูแลโดยอัตโนมัติ ทั้งที่ไม่ได้
      // เป็นผู้ปฏิบัติงานจริงในแต่ละ Task นั้น ๆ จึงให้นับเฉพาะ Task ที่ระบุตัวเขา
      // เป็นผู้รับผิดชอบหลัก (assigneeId) เท่านั้น ไม่นับจากการเป็นผู้ร่วมงานทั่วไป
      const isManagerRole = u.role?.key === 'PROJECT_OWNER' || u.role?.key === 'SCRUM_MASTER';
      const personTasks = allTasks.filter((t: any) =>
        isManagerRole
          ? t.assigneeId === u.id
          : t.assigneeId === u.id ||
            (t.assignees || []).some((a: any) => a.userId === u.id || a.user?.id === u.id)
      );
      const kpi = computeIndividualKpi(personTasks);
      return {
        userId: u.id,
        userName: u.name,
        avatarUrl: u.avatarUrl,
        sectionName: u.section?.name || '-',
        ...kpi,
      };
    })
    .sort((a, b) => {
      // เรียงจากจำนวน Task ที่ได้รับมอบหมายมากไปน้อยก่อน แล้วตามด้วยคะแนนประสิทธิภาพมากไปน้อย
      if (b.assignedCount !== a.assignedCount) return b.assignedCount - a.assignedCount;
      if (a.performanceScore === null && b.performanceScore === null) return a.userName.localeCompare(b.userName);
      if (a.performanceScore === null) return 1;
      if (b.performanceScore === null) return -1;
      return b.performanceScore - a.performanceScore;
    });

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
        กำลังโหลดข้อมูลแดชบอร์ด...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Executive & Team Control Tower
            </span>
            {!isFullAccessUser && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" /> เฉพาะโครงการของคุณ ({accessibleProjects.length} โครงการ)
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">
            แดชบอร์ดภาพรวม OKRs & KPIs ({isFullAccessUser ? 'ระดับองค์กร' : 'โครงการเฉพาะทีมของคุณ'})
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            สรุปดัชนีชี้วัดความสำเร็จของโครงการและเป้าหมายเชิงยุทธศาสตร์ที่รับผิดชอบ
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Projects */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">จำนวนโครงการทั้งหมด</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalProjects}</h3>
            <p className="text-[10px] text-emerald-400 mt-0.5">ดำเนินการ {inProgressProjects} โครงการ</p>
          </div>
        </div>

        {/* Card 2: Overall Task Progress % */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium leading-tight">เปอร์เซ็นต์ความก้าวหน้ารวม</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{overallTaskProgress}%</h3>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${overallTaskProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Card 3: Total Tasks */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">จำนวน Task ทั้งหมด</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalTasks}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">ทุก Backlog / Sprint</p>
          </div>
        </div>

        {/* Card 4: Done Tasks */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">Task ที่เสร็จแล้ว</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{doneTasks}</h3>
            <p className="text-[10px] text-teal-400 mt-0.5">จาก {totalTasks} Task ทั้งหมด</p>
          </div>
        </div>

        {/* Card 5: Total Sprints */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">จำนวน Sprint ทั้งหมด</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalSprints}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">ในทุกโครงการ</p>
          </div>
        </div>

        {/* Card 6: Unassigned People */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">คนที่ไม่มี Task</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{unassignedPeople}</h3>
            <p className="text-[10px] text-rose-400 mt-0.5">ยังไม่ได้รับมอบหมาย</p>
          </div>
        </div>
      </div>

      {/* Project Backlog Success Progress Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">ตารางสรุปความก้าวหน้าโครงการ (คำนวณจาก Tasks ที่สำเร็จ)</h2>
          </div>
          <span className="text-xs text-slate-400">({accessibleProjects.length} โครงการ)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ชื่อโครงการ</th>
                <th className="py-3 px-4">ส่วนงาน / ผู้รับผิดชอบ</th>
                <th className="py-3 px-4 text-center">Tasks (สำเร็จ / ทั้งหมด)</th>
                <th className="py-3 px-4">ความก้าวหน้า (%)</th>
                <th className="py-3 px-4 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
                {accessibleProjects.map((prj: any) => {
                  const prjTasks = allTasks.filter((t: any) => t.projectId === prj.id);
                  const donePrjTasks = prjTasks.filter((t: any) => t.status === 'DONE');
                  const taskProgress = prjTasks.length > 0
                    ? Math.round((donePrjTasks.length / prjTasks.length) * 100)
                    : (prj.progress || 0);
                  return (
                  <tr key={prj.id} className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <span>{prj.name}</span>
                      <span className="ml-2 text-[10px] font-mono text-blue-400 bg-slate-800 px-2 py-0.5 rounded">
                        {prj.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300">{prj.section?.name}</span>
                      <p className="text-[10px] text-slate-400">หัวหน้าโครงการ: {prj.owner?.name}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {prjTasks.length > 0
                        ? `${donePrjTasks.length} / ${prjTasks.length} Tasks`
                        : `${prj.successBacklogs || 0} / ${prj.totalBacklogs || 0} Backlog`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-28 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(taskProgress, 100)}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-white text-xs">{taskProgress}%</span>
                      </div>
                    </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${
                        taskProgress >= 100
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : taskProgress > 0
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {taskProgress >= 100 ? 'SUCCESS' : taskProgress > 0 ? 'IN_PROGRESS' : 'PLANNED'}
                    </span>
                  </td>
                </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team & Task Assignment Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">ตารางสรุปทีมงานและงานที่มอบหมายรายบุคคล</h2>
          </div>
          <span className="text-xs text-slate-400">({teamAssignmentRows.length} คน)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-xs text-slate-300">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[32%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">โครงการ</th>
                <th className="py-3 px-4">ใคร (ทีมงาน / บทบาท)</th>
                <th className="py-3 px-4">งาน (Task)</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">ความสำคัญ</th>
                <th className="py-3 px-4">กำหนดเสร็จ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {teamTaskDetailRows.map((r) => (
                <tr key={r.key} className="hover:bg-slate-800/40 transition-all align-top">
                  {r.projectRowSpan > 0 && (
                    <td
                      rowSpan={r.projectRowSpan}
                      className="py-3.5 px-4 font-bold text-white align-top border-r border-slate-800/60"
                    >
                      <span>{r.projectName}</span>
                      <span className="block mt-1 w-fit text-[10px] font-mono text-blue-400 bg-slate-800 px-2 py-0.5 rounded">
                        {r.projectCode}
                      </span>
                    </td>
                  )}
                  {r.personRowSpan > 0 && (
                    <td
                      rowSpan={r.personRowSpan}
                      className="py-3.5 px-4 align-top border-r border-slate-800/60"
                    >
                      <p className="font-semibold text-white">{r.userName}</p>
                      <span
                        className={`inline-block mt-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          r.roleLabel === 'หัวหน้าโครงการ'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.roleLabel}
                      </span>
                    </td>
                  )}
                  <td className="py-3.5 px-4">
                    {r.task ? (
                      <span className="text-slate-200 line-clamp-2">{r.task.title}</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">ยังไม่มีงานที่มอบหมาย</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {r.task && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          TASK_STATUS_CHIP[r.task.status] || TASK_STATUS_CHIP.TODO
                        }`}
                      >
                        {r.task.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {r.task && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          TASK_PRIORITY_CHIP[r.task.priority] || TASK_PRIORITY_CHIP.MEDIUM
                        }`}
                      >
                        {r.task.priority}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-300">
                    {r.task ? formatDeadline(r.task.dueDate) : <span className="text-slate-500">-</span>}
                  </td>
                </tr>
              ))}
              {teamTaskDetailRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-slate-500">
                    ไม่พบข้อมูลทีมงานในโครงการที่เข้าถึงได้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual KPI Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">ตาราง KPI รายบุคคล</h2>
          </div>
          <span className="text-xs text-slate-400">
            ({kpiRows.length} คน · ไม่รวมสังกัด{KPI_EXCLUDED_SECTION_NAME})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ชื่อ-สกุล</th>
                <th className="py-3 px-4">สังกัด</th>
                <th className="py-3 px-4 text-center">จำนวน Task ที่ได้รับมอบหมาย</th>
                <th className="py-3 px-4 text-center">จำนวน Task ที่ทำสำเร็จ</th>
                <th className="py-3 px-4 text-center">Task ที่ทำสำเร็จตรงเวลา</th>
                <th className="py-3 px-4 text-right">คะแนนประสิทธิภาพ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {kpiRows.map((row) => (
                <tr key={row.userId} className="hover:bg-slate-800/40 transition-all">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white">{row.userName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{row.sectionName}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                    {row.assignedCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                    {row.doneCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-400">
                    {row.onTimeCount}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.performanceScore === null ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        ยังไม่มีงาน
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border ${
                          row.performanceScore >= 80
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : row.performanceScore >= 50
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : row.performanceScore >= 25
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {row.performanceScore}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {kpiRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-slate-500">
                    ไม่พบข้อมูลพนักงานที่เข้าเกณฑ์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
