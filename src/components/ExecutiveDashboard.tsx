'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Building2, FolderKanban, BarChart3, Lock } from 'lucide-react';

interface OKRItem {
  id: string;
  objective: string;
  keyResult: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
  status: string;
  projectId?: string;
  project?: { name: string; code: string };
  section?: { name: string; code: string };
}

interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  status: string;
  ownerId?: string;
  owner?: { id: string };
  members?: Array<{ userId: string; user?: { id: string } }>;
  section: { name: string; code: string };
}

export default function ExecutiveDashboard() {
  const { currentUser, isExecutive, isAdvisor } = useAuth();
  const [okrs, setOkrs] = useState<OKRItem[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [allSprints, setAllSprints] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Always read from the live database rather than a local cache, so this
  // dashboard reflects real current state after edits made elsewhere.
  const loadData = async () => {
    try {
      const [resOkrs, resPrj, resTasks, resSprints, resUsers] = await Promise.all([
        fetch('/api/okrs'),
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/sprints'),
        fetch('/api/users'),
      ]);
      if (resOkrs.ok) {
        const dataOkrs: any = await resOkrs.json();
        if (dataOkrs.success && Array.isArray(dataOkrs.data)) setOkrs(dataOkrs.data);
      }
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

  const accessibleOkrs = isFullAccessUser
    ? okrs
    : okrs.filter((o) => !o.projectId || accessibleProjectIds.has(o.projectId));

  const totalProjects = accessibleProjects.length;
  const inProgressProjects = accessibleProjects.filter((p) => p.status === 'IN_PROGRESS').length;
  const avgOkrProgress = accessibleOkrs.length > 0
    ? Math.round(accessibleOkrs.reduce((acc, curr) => acc + curr.progress, 0) / accessibleOkrs.length)
    : 0;
  const atRiskOkrs = accessibleOkrs.filter((o) => o.status === 'AT_RISK' || o.status === 'BEHIND').length;

  // Task & Sprint metrics
  const accessibleProjectIds2 = new Set(accessibleProjects.map((p) => p.id));
  const accessibleTasks = allTasks.filter((t: any) => accessibleProjectIds2.has(t.projectId));
  const totalTasks = accessibleTasks.length;
  const doneTasks = accessibleTasks.filter((t: any) => t.status === 'DONE').length;
  const overallTaskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const accessibleSprints = allSprints.filter((s: any) => accessibleProjectIds2.has(s.projectId));
  const totalSprints = accessibleSprints.length;
  // People without assigned tasks
  const assignedUserIds = new Set(accessibleTasks.filter((t: any) => t.assigneeId).map((t: any) => t.assigneeId));
  const unassignedPeople = allUsers.filter((u: any) => !assignedUserIds.has(u.id)).length;

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
                      <p className="text-[10px] text-slate-400">ผอ.ส่วน: {prj.owner?.name}</p>
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

      {/* OKR Progress List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">ตารางติดตามความก้าวหน้า OKRs</h2>
          </div>
          <span className="text-xs text-slate-400">({accessibleOkrs.length} รายการ)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">เป้าหมาย (Objective & Key Result)</th>
                <th className="py-3 px-4">โครงการ / สังกัด</th>
                <th className="py-3 px-4">เป้าหมาย vs ปัจจุบัน</th>
                <th className="py-3 px-4">ความก้าวหน้า (%)</th>
                <th className="py-3 px-4 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {accessibleOkrs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="py-3.5 px-4">
                    <h4 className="font-bold text-white text-xs">{item.objective}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{item.keyResult}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-blue-300">{item.project?.name || 'ยุทธศาสตร์กลาง'}</span>
                    <p className="text-[10px] text-slate-400">{item.section?.name}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="text-white font-bold">{item.currentValue}</span> / {item.targetValue} {item.unit}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(item.progress, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-white text-xs">{item.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${
                        item.status === 'ON_TRACK'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'COMPLETED'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
