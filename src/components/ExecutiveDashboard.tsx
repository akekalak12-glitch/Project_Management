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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const uParam = currentUser?.id ? `?userId=${currentUser.id}` : '';
        const [resOkrs, resPrj] = await Promise.all([
          fetch('/api/okrs'),
          fetch(`/api/projects${uParam}`),
        ]);
        const dataOkrs = await resOkrs.json();
        const dataPrj = await resPrj.json();

        if (dataOkrs.success) setOkrs(dataOkrs.data);
        if (dataPrj.success) setProjects(dataPrj.data);
      } catch (e) {
        console.error('Failed to fetch executive dashboard data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser?.id]);

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">โครงการในสิทธิ์ของคุณ</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalProjects} โครงการ</h3>
            <p className="text-[11px] text-emerald-400 mt-1">กำลังดำเนินการ {inProgressProjects} โครงการ</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">ความก้าวหน้าเฉลี่ย OKRs</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{avgOkrProgress}%</h3>
            <div className="w-32 bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${avgOkrProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">ตัวชี้วัด OKRs ทั้งหมด</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{accessibleOkrs.length} เป้าหมาย</h3>
            <p className="text-[11px] text-slate-400 mt-1">แยกตามยุทธศาสตร์โครงการ</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">OKRs ที่ต้องเฝ้าระวัง</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{atRiskOkrs} เป้าหมาย</h3>
            <p className="text-[11px] text-rose-400 mt-1">สถานะล่าช้า / มีความเสี่ยง</p>
          </div>
        </div>
      </div>

      {/* Project Backlog Success Progress Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">ตารางสรุปความก้าวหน้าโครงการ (คำนวณจาก Backlog ที่ Success)</h2>
          </div>
          <span className="text-xs text-slate-400">({accessibleProjects.length} โครงการ)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ชื่อโครงการ</th>
                <th className="py-3 px-4">ส่วนงาน / ผู้รับผิดชอบ</th>
                <th className="py-3 px-4 text-center">จำนวน Backlog (Success / ทั้งหมด)</th>
                <th className="py-3 px-4">ความก้าวหน้า (%)</th>
                <th className="py-3 px-4 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {accessibleProjects.map((prj: any) => (
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
                    {prj.successBacklogs || 0} / {prj.totalBacklogs || 0} รายการ
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(prj.progress || 0, 100)}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-white text-xs">{prj.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${
                        prj.progress >= 100
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : prj.progress > 0
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {prj.progress >= 100 ? 'SUCCESS' : prj.progress > 0 ? 'IN_PROGRESS' : 'PLANNED'}
                    </span>
                  </td>
                </tr>
              ))}
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
