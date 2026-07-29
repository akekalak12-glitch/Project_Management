'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, FileText, Printer, Loader2 } from 'lucide-react';

interface ProjectReportModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  LOW:    { label: 'ต่ำ',    bg: '#f0fdf4', color: '#16a34a' },
  MEDIUM: { label: 'กลาง',   bg: '#fefce8', color: '#ca8a04' },
  HIGH:   { label: 'สูง',    bg: '#fff7ed', color: '#ea580c' },
  URGENT: { label: 'ด่วน!',  bg: '#fef2f2', color: '#dc2626' },
};

const BACKLOG_STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PLANNED:           { label: 'วางแผน',         bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  IN_PROGRESS:       { label: 'กำลังดำเนินการ', bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  SUCCESS:           { label: '✅ Success',       bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  FLEXIBLE_REVISED:  { label: 'ปรับแผน',        bg: '#fdf4ff', color: '#9333ea', border: '#d8b4fe' },
};

const TASK_STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  TODO:        { label: 'รอดำเนินการ',    bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  IN_REVIEW:   { label: 'รอ Review',       bg: '#fdf4ff', color: '#9333ea', border: '#d8b4fe' },
  DONE:        { label: '✅ เสร็จสิ้น',    bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
};

const KANBAN_COLUMNS = [
  { key: 'TODO',        label: 'To Do',       color: '#64748b', headerBg: '#f1f5f9' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#2563eb', headerBg: '#dbeafe' },
  { key: 'IN_REVIEW',   label: 'In Review',   color: '#9333ea', headerBg: '#f3e8ff' },
  { key: 'DONE',        label: 'Done ✅',      color: '#16a34a', headerBg: '#dcfce7' },
];

export default function ProjectReportModal({
  projectId,
  projectName,
  isOpen,
  onClose,
}: ProjectReportModalProps) {
  const [sprints,  setSprints]  = useState<any[]>([]);
  const [members,  setMembers]  = useState<any[]>([]);
  const [tasks,    setTasks]    = useState<any[]>([]);
  const [backlogs, setBacklogs] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (key: string) =>
    setExpandedMonths(prev => ({ ...prev, [key]: !(prev[key] ?? true) }));

  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [resSprints, resMembers, resTasks] = await Promise.all([
        fetch(`/api/sprints?projectId=${projectId}`),
        fetch(`/api/projects/${projectId}/members`),
        fetch(`/api/tasks?projectId=${projectId}`),
      ]);
      const [ds, dm, dt] = await Promise.all([
        resSprints.json(), resMembers.json(), resTasks.json(),
      ]);

      const sprintsData: any[] = ds.success ? ds.data : [];
      setSprints(sprintsData);
      setMembers(dm.success ? dm.data : []);
      setTasks(dt.success ? dt.data : []);

      const allBacklogs: any[] = [];
      await Promise.all(
        sprintsData.map(async (s: any) => {
          const res = await fetch(`/api/backlog?sprintId=${s.id}`);
          const d: any = await res.json();
          if (d.success) allBacklogs.push(...d.data);
        })
      );
      setBacklogs(allBacklogs);
    } catch (e) {
      console.error('Report load failed', e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  // ── Print (PDF via browser dialog) ─────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // ── Computed values ──────────────────────────────────────────────────────────
  const totalBacklogs   = backlogs.length;
  const successBacklogs = backlogs.filter((b) => b.status === 'SUCCESS').length;
  const progress        = totalBacklogs > 0 ? Math.round((successBacklogs / totalBacklogs) * 100) : 0;
  const totalTasks      = tasks.length;
  const doneTasks       = tasks.filter((t) => t.status === 'DONE').length;
  const taskProgress    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const fmtDate = (d: any) => d
    ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
    : '-';

  // ── Inline style helpers ─────────────────────────────────────────────────────
  const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '7px 9px', fontSize: '10.5px', color: '#334155', verticalAlign: 'top', ...extra,
  });
  const th = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '8px 9px', fontSize: '9.5px', fontWeight: 700,
    background: '#f1f5f9', color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.4px', borderBottom: '2px solid #e2e8f0', ...extra,
  });
  const sectionTitle = (color: string): React.CSSProperties => ({
    fontSize: '13px', fontWeight: 800, color: '#0f172a',
    borderLeft: `4px solid ${color}`, paddingLeft: '12px',
    margin: '0 0 12px',
  });
  const badge = (s: { bg: string; color: string; border: string }): React.CSSProperties => ({
    display: 'inline-block',
    background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    borderRadius: '20px', padding: '2px 8px', fontSize: '9.5px', fontWeight: 700,
  });

  // ── Sprint month groups ──────────────────────────────────────────────────────
  const monthGroups = Object.entries(
    sprints.reduce((acc: Record<string, any[]>, sprint) => {
      const mk = new Date(sprint.startDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
      (acc[mk] = acc[mk] || []).push(sprint);
      return acc;
    }, {})
  ).map(([month, sp]) => ({ month, sprints: sp }));

  // ── Pie / donut arc helper ───────────────────────────────────────────────────
  const r = 32;
  const circ = 2 * Math.PI * r;

  return (
    <>
      {/* ── Print CSS injected inline so it's always present ────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');

        @media print {
          /* Hide everything except the report */
          body > * { display: none !important; }
          #report-print-root { display: block !important; }

          #report-print-root {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            height: auto;
            background: white;
          }

          /* hide control bar */
          .report-control-bar { display: none !important; }

          /* full-width report */
          .report-paper {
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* page-break rules */
          .no-break        { page-break-inside: avoid; break-inside: avoid; }
          .page-break-before { page-break-before: always; break-before: always; }

          /* tables: don't orphan header */
          thead { display: table-header-group; }
          tr    { page-break-inside: avoid; break-inside: avoid; }

          /* make header gradient print */
          .report-cover {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
        }

        @media screen {
          .report-modal-backdrop {
            position: fixed; inset: 0;
            background: rgba(2,6,23,0.92);
            backdrop-filter: blur(4px);
            z-index: 50;
            display: flex; flex-direction: column; align-items: center;
            overflow-y: auto; padding: 16px;
          }
        }
      `}</style>

      <div id="report-print-root" className="report-modal-backdrop">

        {/* ── Control Bar (hidden on print) ───────────────────────────────────── */}
        <div className="report-control-bar" style={{
          position: 'sticky', top: 0, zIndex: 60,
          display: 'flex', alignItems: 'center', gap: '12px',
          background: '#0f172a', border: '1px solid #334155',
          borderRadius: '16px', padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          width: '100%', maxWidth: '960px', marginBottom: '12px',
        }}>
          <FileText style={{ width: 18, height: 18, color: '#60a5fa', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
            Preview รายงานโครงการ (ฉบับละเอียด)
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            · {projectName}
          </span>
          <button
            onClick={handlePrint}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px', background: loading ? '#374151' : '#059669',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 700,
              transition: 'background 0.2s',
            }}
          >
            {loading
              ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />กำลังโหลด...</>
              : <><Printer style={{ width: 15, height: 15 }} />พิมพ์ / บันทึก PDF</>
            }
          </button>
          <button
            onClick={onClose}
            style={{ padding: '8px', background: 'transparent', border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* ── Loading ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#94a3b8', gap: '12px' }}>
            <Loader2 style={{ width: 28, height: 28, animation: 'spin 1s linear infinite' }} />
            กำลังโหลดข้อมูลรายงาน...
          </div>
        ) : (

          /* ── Report Paper ──────────────────────────────────────────────────── */
          <div ref={printRef} className="report-paper" style={{
            background: 'white', width: '100%', maxWidth: '960px',
            borderRadius: '16px', overflow: 'hidden',
            fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>

            {/* ══ 1. COVER ══════════════════════════════════════════════════════ */}
            <div className="report-cover no-break" style={{
              background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#0f172a 100%)',
              padding: '36px 48px 28px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ flex: 1, paddingRight: '24px' }}>
                  <p style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>
                    PROJECT STATUS REPORT · DETAIL VERSION
                  </p>
                  <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.35 }}>
                    {projectName}
                  </h1>
                  <p style={{ color: '#60a5fa', fontSize: '11px', margin: 0 }}>
                    วันที่จัดทำ: {today}
                  </p>
                </div>
                {/* Donut progress */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
                      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                      <circle cx="40" cy="40" r={r} fill="none"
                        stroke={progress >= 75 ? '#10b981' : progress >= 40 ? '#f59e0b' : '#3b82f6'}
                        strokeWidth="8"
                        strokeDasharray={circ}
                        strokeDashoffset={circ * (1 - progress / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: '17px', fontWeight: 800 }}>{progress}%</span>
                    </div>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '9px', margin: '6px 0 0' }}>Backlog Success</p>
                </div>
              </div>

              {/* KPI boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Sprint ทั้งหมด', value: sprints.length,               color: '#818cf8' },
                  { label: 'Backlog รวม',    value: totalBacklogs,                color: '#60a5fa' },
                  { label: 'Backlog Success',value: successBacklogs,              color: '#34d399' },
                  { label: 'Task รวม',       value: totalTasks,                   color: '#fb923c' },
                  { label: 'Task Done',      value: `${doneTasks}/${totalTasks}`, color: '#4ade80' },
                ].map((k, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.08)', borderRadius: '10px',
                    padding: '12px 8px', textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <p style={{ color: k.color, fontSize: '20px', fontWeight: 800, margin: '0 0 3px' }}>{k.value}</p>
                    <p style={{ color: '#94a3b8', fontSize: '9px', margin: 0 }}>{k.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ 2. TEAM ════════════════════════════════════════════════════════ */}
            <div className="no-break" style={{ padding: '24px 48px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={sectionTitle('#3b82f6')}>👥 ทีมงานโครงการ</h2>
              {members.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '11px' }}>ยังไม่มีสมาชิก</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {members.map((m: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      borderRadius: '8px', padding: '9px 12px',
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#e2e8f0', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '13px', fontWeight: 700,
                        color: '#475569', flexShrink: 0,
                      }}>
                        {m.user?.name?.charAt(0) || '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.user?.name}
                        </p>
                        <p style={{ fontSize: '9.5px', color: '#94a3b8', margin: '2px 0 0' }}>
                          {m.user?.role?.title || ''}
                          {m.projectRole === 'OWNER' ? ' · ⭐ เจ้าของโครงการ' : m.projectRole === 'SCRUM_MASTER' ? ' · 🔧 SM' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ══ 3. SPRINT BOARD ════════════════════════════════════════════════ */}
            <div style={{ padding: '24px 48px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={sectionTitle('#8b5cf6')}>🚀 Sprint Board — รายละเอียด Sprint และ Backlog Items</h2>

              {sprints.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '11px' }}>ยังไม่มี Sprint ในโครงการนี้</p>
              ) : (
                <>
                  {monthGroups.map((group, gi) => {
                    const monthSprintIds = group.sprints.map((s) => s.id);
                    const monthBacklogs  = backlogs.filter((b) => monthSprintIds.includes(b.sprintId));
                    const monthSuccess   = monthBacklogs.filter((b) => b.status === 'SUCCESS').length;
                    const monthBTotal    = monthBacklogs.length;
                    const monthBPct      = monthBTotal > 0 ? Math.round((monthSuccess / monthBTotal) * 100) : 0;
                    const monthTasks     = tasks.filter((t) => group.sprints.some((s) => t.sprint?.id === s.id));
                    const monthDone      = monthTasks.filter((t) => t.status === 'DONE').length;
                    const monthTTotal    = monthTasks.length;
                    const monthTPct      = monthTTotal > 0 ? Math.round((monthDone / monthTTotal) * 100) : 0;
                    const isExpanded     = expandedMonths[group.month] ?? true;

                    return (
                      <div key={gi} style={{ marginBottom: '20px' }}>
                        {/* Month row */}
                        <div
                          onClick={() => toggleMonth(group.month)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            cursor: 'pointer', background: '#eef2ff',
                            padding: '10px 14px', borderRadius: '8px 8px 0 0',
                            borderBottom: '2px solid #c7d2fe',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#3730a3' }}>{group.month}</h3>
                            <span style={{ fontSize: '10px', color: '#6366f1', background: '#e0e7ff', padding: '2px 8px', borderRadius: '20px' }}>
                              {group.sprints.length} sprint
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#475569' }}>
                              Backlog <strong style={{ color: '#10b981' }}>{monthBPct}%</strong> ({monthSuccess}/{monthBTotal})
                            </span>
                            <span style={{ fontSize: '10px', color: '#475569' }}>
                              Task <strong style={{ color: '#8b5cf6' }}>{monthTPct}%</strong> ({monthDone}/{monthTTotal})
                            </span>
                            <span style={{ fontSize: '11px', color: '#6366f1' }}>{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '12px', background: '#fafafa' }}>
                            {group.sprints.map((sprint, si) => {
                              const sprintBLs      = backlogs.filter((b) => b.sprintId === sprint.id);
                              const sprintSuccess  = sprintBLs.filter((b) => b.status === 'SUCCESS').length;
                              const sprintPct      = sprintBLs.length > 0 ? Math.round((sprintSuccess / sprintBLs.length) * 100) : 0;
                              const statusColor    = sprint.status === 'ACTIVE' ? { bg: '#dcfce7', color: '#16a34a', border: '#86efac' }
                                                   : sprint.status === 'COMPLETED' ? { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' }
                                                   : { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
                              return (
                                <div key={sprint.id} className="no-break" style={{
                                  marginBottom: '14px',
                                  border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden',
                                  background: 'white',
                                }}>
                                  {/* Sprint header */}
                                  <div style={{
                                    background: sprint.status === 'ACTIVE' ? '#f0fdf4' : '#f8fafc',
                                    padding: '10px 14px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderBottom: '1px solid #e2e8f0',
                                  }}>
                                    <div>
                                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', margin: '0 0 2px' }}>
                                        Sprint {si + 1}: {sprint.name}
                                      </p>
                                      <p style={{ fontSize: '9.5px', color: '#64748b', margin: 0 }}>
                                        {fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}
                                        {' · '}{sprint.cadence === 'WEEKLY' ? 'รายสัปดาห์' : 'รายเดือน'}
                                        {sprint.goal ? ` · 🎯 ${sprint.goal}` : ''}
                                      </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                      <span style={badge(statusColor)}>
                                        {sprint.status === 'ACTIVE' ? '🟢 Active' : sprint.status === 'COMPLETED' ? '✅ Completed' : '⏸ Inactive'}
                                      </span>
                                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>
                                        {sprintPct}% ({sprintSuccess}/{sprintBLs.length})
                                      </span>
                                    </div>
                                  </div>
                                  {/* Progress bar */}
                                  <div style={{ background: '#e2e8f0', height: '4px' }}>
                                    <div style={{ background: sprintPct === 100 ? '#10b981' : '#3b82f6', height: '100%', width: `${sprintPct}%` }} />
                                  </div>
                                  {/* Backlog table */}
                                  {sprintBLs.length === 0 ? (
                                    <p style={{ padding: '10px 14px', fontSize: '10px', color: '#94a3b8', margin: 0 }}>ไม่มี Backlog ใน Sprint นี้</p>
                                  ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                                      <thead>
                                        <tr>
                                          <th style={{ ...th(), width: '28px' }}>#</th>
                                          <th style={{ ...th(), width: '22%' }}>Backlog</th>
                                          <th style={th()}>รายละเอียด</th>
                                          <th style={{ ...th(), textAlign: 'center', width: '70px' }}>ความสำคัญ</th>
                                          <th style={{ ...th(), textAlign: 'center', width: '90px' }}>สถานะ</th>
                                          <th style={{ ...th(), width: '90px' }}>ผู้รับผิดชอบ</th>
                                          <th style={{ ...th(), width: '70px' }}>กำหนดเสร็จ</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sprintBLs.map((bl, bi) => {
                                          const ps = PRIORITY_STYLE[bl.priority] || PRIORITY_STYLE.MEDIUM;
                                          const ss = BACKLOG_STATUS_STYLE[bl.status] || BACKLOG_STATUS_STYLE.PLANNED;
                                          return (
                                            <tr key={bl.id} style={{ borderBottom: '1px solid #f1f5f9', background: bi % 2 === 0 ? 'white' : '#fafafa' }}>
                                              <td style={{ ...cell({ textAlign: 'center', color: '#94a3b8', fontWeight: 700 }) }}>{bi + 1}</td>
                                              <td style={{ ...cell({ fontWeight: 700, color: '#1e293b' }) }}>{bl.title}</td>
                                              <td style={{ ...cell({ color: '#64748b' }) }}>
                                                {bl.description
                                                  ? bl.description.substring(0, 80) + (bl.description.length > 80 ? '…' : '')
                                                  : <span style={{ color: '#cbd5e1' }}>-</span>}
                                              </td>
                                              <td style={{ ...cell({ textAlign: 'center' }) }}>
                                                <span style={{ display: 'inline-block', background: ps.bg, color: ps.color, padding: '2px 7px', borderRadius: '20px', fontWeight: 700, fontSize: '9px' }}>
                                                  {ps.label}
                                                </span>
                                              </td>
                                              <td style={{ ...cell({ textAlign: 'center' }) }}>
                                                <span style={badge(ss)}>{ss.label}</span>
                                              </td>
                                              <td style={cell()}>{bl.assignee?.name || <span style={{ color: '#cbd5e1' }}>-</span>}</td>
                                              <td style={cell()}>{fmtDate(bl.endDate)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* ══ 4. KANBAN ══════════════════════════════════════════════════════ */}
            <div className="no-break" style={{ padding: '24px 48px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={sectionTitle('#f59e0b')}>📋 Kanban Board — สรุปรายการงาน (Tasks) ตามสถานะ</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {KANBAN_COLUMNS.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col.key);
                  return (
                    <div key={col.key} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <div style={{
                        background: col.headerBg, padding: '9px 12px',
                        borderBottom: '2px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: col.color }}>{col.label}</span>
                        <span style={{
                          background: col.color, color: 'white', borderRadius: '50%',
                          width: '20px', height: '20px', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '10px', fontWeight: 700,
                        }}>
                          {colTasks.length}
                        </span>
                      </div>
                      <div style={{ background: '#fafafa', minHeight: '60px', padding: '6px' }}>
                        {colTasks.length === 0 ? (
                          <p style={{ color: '#cbd5e1', fontSize: '9.5px', textAlign: 'center', padding: '10px 0', margin: 0 }}>ไม่มีงาน</p>
                        ) : colTasks.map((t: any) => {
                          const ps = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.MEDIUM;
                          return (
                            <div key={t.id} style={{
                              background: 'white', border: '1px solid #e2e8f0',
                              borderRadius: '6px', padding: '7px 9px', marginBottom: '5px',
                              borderLeft: `3px solid ${ps.color}`,
                            }}>
                              <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#1e293b', margin: '0 0 3px', lineHeight: 1.4 }}>{t.title}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ background: ps.bg, color: ps.color, fontSize: '8.5px', fontWeight: 700, padding: '1px 5px', borderRadius: '20px' }}>{ps.label}</span>
                                {t.assignee && <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>👤 {t.assignee.name}</span>}
                              </div>
                              {t.dueDate && <p style={{ fontSize: '8.5px', color: '#94a3b8', margin: '3px 0 0' }}>📅 {fmtDate(t.dueDate)}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ 5. TASK DETAIL TABLE ═══════════════════════════════════════════ */}
            <div style={{ padding: '24px 48px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={sectionTitle('#10b981')}>📝 รายการงาน (Tasks) — ตารางละเอียด</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                <thead>
                  <tr>
                    <th style={{ ...th(), width: '28px' }}>#</th>
                    <th style={{ ...th(), width: '22%' }}>ชื่องาน</th>
                    <th style={th()}>รายละเอียด</th>
                    <th style={{ ...th(), textAlign: 'center', width: '70px' }}>ความสำคัญ</th>
                    <th style={{ ...th(), textAlign: 'center', width: '90px' }}>สถานะ</th>
                    <th style={{ ...th(), width: '90px' }}>ผู้รับมอบหมาย</th>
                    <th style={{ ...th(), width: '70px' }}>กำหนดส่ง</th>
                    <th style={{ ...th(), width: '80px' }}>Sprint</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...cell({ textAlign: 'center', color: '#94a3b8', padding: '20px' }) }}>
                        ยังไม่มีงาน (Task) ในโครงการนี้
                      </td>
                    </tr>
                  ) : tasks.map((t: any, i: number) => {
                    const ps = PRIORITY_STYLE[t.priority]  || PRIORITY_STYLE.MEDIUM;
                    const ts = TASK_STATUS_STYLE[t.status] || TASK_STATUS_STYLE.TODO;
                    const assigneeNames = t.assignees && t.assignees.length > 0
                      ? t.assignees.map((a: any) => a.user?.name).filter(Boolean).join(', ')
                      : t.assignee?.name || '';
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ ...cell({ textAlign: 'center', color: '#94a3b8', fontWeight: 700 }) }}>{i + 1}</td>
                        <td style={{ ...cell({ fontWeight: 700, color: '#1e293b' }) }}>{t.title}</td>
                        <td style={{ ...cell({ color: '#64748b' }) }}>
                          {t.description
                            ? t.description.substring(0, 70) + (t.description.length > 70 ? '…' : '')
                            : <span style={{ color: '#cbd5e1' }}>-</span>}
                        </td>
                        <td style={{ ...cell({ textAlign: 'center' }) }}>
                          <span style={{ background: ps.bg, color: ps.color, padding: '2px 7px', borderRadius: '20px', fontWeight: 700, fontSize: '9px' }}>{ps.label}</span>
                        </td>
                        <td style={{ ...cell({ textAlign: 'center' }) }}>
                          <span style={badge(ts)}>{ts.label}</span>
                        </td>
                        <td style={cell()}>{assigneeNames || <span style={{ color: '#cbd5e1' }}>-</span>}</td>
                        <td style={cell()}>{fmtDate(t.dueDate)}</td>
                        <td style={{ ...cell({ color: '#8b5cf6', fontWeight: 600 }) }}>{t.sprint?.name || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ══ 6. SUMMARY ════════════════════════════════════════════════════ */}
            <div className="no-break" style={{ padding: '24px 48px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h2 style={sectionTitle('#ef4444')}>📊 สรุปภาพรวมความก้าวหน้า</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Backlog */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: '0 0 10px' }}>🎯 Backlog Success Rate</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Success {successBacklogs} / {totalBacklogs} รายการ</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{progress}%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ background: progress >= 75 ? '#10b981' : progress >= 40 ? '#f59e0b' : '#3b82f6', height: '100%', width: `${progress}%`, borderRadius: '100px' }} />
                  </div>
                </div>
                {/* Task */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: '0 0 10px' }}>📝 Task Completion Rate</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Done {doneTasks} / {totalTasks} งาน</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6' }}>{taskProgress}%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ background: '#8b5cf6', height: '100%', width: `${taskProgress}%`, borderRadius: '100px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginTop: '10px' }}>
                    {[
                      { l: 'TODO',        v: tasks.filter(t => t.status === 'TODO').length,        c: '#64748b' },
                      { l: 'In Progress', v: tasks.filter(t => t.status === 'IN_PROGRESS').length, c: '#2563eb' },
                      { l: 'In Review',   v: tasks.filter(t => t.status === 'IN_REVIEW').length,   c: '#9333ea' },
                      { l: 'Done',        v: doneTasks,                                            c: '#16a34a' },
                    ].map((item, i) => (
                      <div key={i} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '6px', padding: '6px 4px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 800, color: item.c, margin: '0 0 2px' }}>{item.v}</p>
                        <p style={{ fontSize: '8.5px', color: '#94a3b8', margin: 0 }}>{item.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
            <div className="no-break report-cover" style={{
              background: '#0f172a', padding: '16px 48px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '9.5px', margin: 0 }}>📄 ระบบบริหารโครงการ Enterprise PM System</p>
                <p style={{ color: '#475569', fontSize: '9.5px', margin: '2px 0 0' }}>วันที่ส่งออก: {today}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#60a5fa', fontSize: '10px', fontWeight: 700, margin: 0 }}>ความก้าวหน้ารวม</p>
                <p style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: '2px 0 0' }}>
                  Backlog {progress}% · Task {taskProgress}%
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
