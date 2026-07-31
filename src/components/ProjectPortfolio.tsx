'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import TeamFormationModal from './TeamFormationModal';
import ProjectReportModal from './ProjectReportModal';
import SaveAndSyncButton from './SaveAndSyncButton';
import {
  FolderKanban,
  Search,
  Plus,
  Users,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  FileText,
} from 'lucide-react';

interface ProjectItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  sectionId: string;
  ownerId: string;
  section: { id: string; name: string; code: string };
  owner: { id: string; name: string; avatarUrl?: string };
  members: Array<{ id: string; userId: string; user: { name: string; avatarUrl?: string } }>;
  _count?: { tasks: number };
}

export default function ProjectPortfolio() {
  const { currentUser, canCreateProject, canManageTeam, isExecutive, isAdvisor } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [projectOwners, setProjectOwners] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Team Formation Modal State
  const [activeProjectForTeam, setActiveProjectForTeam] = useState<{ id: string; name: string } | null>(null);

  // Report/PDF Modal State
  const [activeProjectForReport, setActiveProjectForReport] = useState<{ id: string; name: string } | null>(null);

  // Project CRUD Modal State
  const [showPrjModal, setShowPrjModal] = useState(false);
  const [editingPrjId, setEditingPrjId] = useState<string | null>(null);
  const [prjName, setPrjName] = useState('');
  const [prjCode, setPrjCode] = useState('');
  const [prjDesc, setPrjDesc] = useState('');
  const [prjSecId, setPrjSecId] = useState('');
  const [prjOwnerId, setPrjOwnerId] = useState('');
  const [prjStatus, setPrjStatus] = useState('PLANNING');

  // Always read from the live database, never from a local cache, so this
  // screen reflects the real current state after edits made here or in
  // other screens (Sprint/Kanban etc. dispatch 'app_data_synced').
  const fetchProjectsData = async () => {
    try {
      const [resPrj, resSec, resUsers, resTasks] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/sections'),
        fetch('/api/users'),
        fetch('/api/tasks'),
      ]);
      if (resPrj.ok) {
        const dataPrj: any = await resPrj.json();
        if (dataPrj.success && Array.isArray(dataPrj.data)) setProjects(dataPrj.data);
      }
      if (resSec.ok) {
        const dataSec: any = await resSec.json();
        if (dataSec.success && Array.isArray(dataSec.data)) setSections(dataSec.data);
      }
      if (resUsers.ok) {
        const dataUsers: any = await resUsers.json();
        if (dataUsers.success && Array.isArray(dataUsers.data)) setProjectOwners(dataUsers.data);
      }
      if (resTasks.ok) {
        const dataTasks: any = await resTasks.json();
        if (dataTasks.success && Array.isArray(dataTasks.data)) setTasks(dataTasks.data);
      }
    } catch (e) {
      console.error('Failed to load projects/sections/users/tasks', e);
    }
  };

  useEffect(() => {
    fetchProjectsData();
    if (typeof window !== 'undefined') {
      window.addEventListener('app_data_synced', fetchProjectsData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app_data_synced', fetchProjectsData);
      }
    };
  }, [currentUser?.id]);

  const handleModalSectionChange = (secId: string) => {
    // ส่วนงานที่รับผิดชอบ และ ผอ.ส่วน เลือกไขว้กันได้ ไม่ผูกกัน
    setPrjSecId(secId);
  };

  const handleModalOwnerChange = (ownerId: string) => {
    // ส่วนงานที่รับผิดชอบ และ ผอ.ส่วน เลือกไขว้กันได้ ไม่ผูกกัน
    setPrjOwnerId(ownerId);
  };

  const handleOpenAddProject = () => {
    setEditingPrjId(null);
    setPrjName('');
    setPrjCode(`PRJ-${Date.now().toString().slice(-4)}`);
    setPrjDesc('');
    setPrjStatus('PLANNING');

    const initialSecId = sections[0]?.id || '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22';
    setPrjSecId(initialSecId);

    const ownerInSec = projectOwners.find((u) => u.sectionId === initialSecId || u.section?.id === initialSecId) || projectOwners[0];
    setPrjOwnerId(ownerInSec?.id || currentUser?.id || '8b1f19e0-959c-4c6f-9f4e-fcc4ee8466d4');

    setShowPrjModal(false);
    setTimeout(() => setShowPrjModal(true), 10);
  };

  const handleOpenEditProject = (p: ProjectItem) => {
    setEditingPrjId(p.id);
    setPrjName(p.name);
    setPrjCode(p.code);
    setPrjDesc(p.description || '');
    setPrjSecId(p.sectionId);
    setPrjOwnerId(p.ownerId);
    setPrjStatus(p.status);
    setShowPrjModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prjName || !prjCode) return;

    const matchedSec = sections.find((s) => s.id === prjSecId) || sections[0];
    const matchedOwner = projectOwners.find((u) => u.id === prjOwnerId) || projectOwners[0] || currentUser;

    try {
      const url = editingPrjId ? `/api/projects/${editingPrjId}` : '/api/projects';
      const method = editingPrjId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prjName,
          code: prjCode,
          description: prjDesc,
          sectionId: matchedSec?.id,
          ownerId: matchedOwner?.id,
          status: prjStatus,
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setShowPrjModal(false);
        await fetchProjectsData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app_data_synced'));
        }
      } else {
        alert(`ไม่สามารถบันทึกโครงการได้: ${data.error}`);
      }
    } catch (e: any) {
      console.error('Failed to save project', e);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบโครงการ "${name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data: any = await res.json();
      if (data.success) {
        await fetchProjectsData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app_data_synced'));
        }
      }
    } catch (e) {
      console.error('Failed to delete project', e);
    }
  };

  const accessibleProjects = projects;

  const filteredProjects = accessibleProjects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.section.name.toLowerCase().includes(search.toLowerCase());
    const matchesSection = selectedSection === 'ALL' || p.section.code === selectedSection;
    return matchesSearch && matchesSection;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Project Portfolio Management
            </span>
            <span className="text-xs text-slate-400">({projects.length} โครงการในระบบ)</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">รายการบริหารจัดการโครงการ (Portfolio)</h1>
          <p className="text-slate-400 text-xs mt-1">
            รองรับการ **เพิ่ม แก้ไข ลบ โครงการ** และตั้งทีมงาน (Team Formation) รายโครงการ
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <SaveAndSyncButton />
          {canCreateProject && (
            <button
              onClick={handleOpenAddProject}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> สร้างโครงการใหม่ (Add Project)
            </button>
          )}
        </div>
      </div>



      {/* Projects Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">กำลังโหลดรายการโครงการ...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-blue-400 px-2.5 py-1 rounded-md border border-slate-700">
                    {p.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        p.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {p.status === 'IN_PROGRESS' ? 'In Progress' : 'Planning'}
                    </span>
                    {canCreateProject && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditProject(p)}
                          className="p-1 text-slate-400 hover:text-amber-400 transition-all"
                          title="แก้ไขโครงการ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id, p.name)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-all"
                          title="ลบโครงการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setActiveProjectForReport({ id: p.id, name: p.name })}
                      className="p-1 text-slate-400 hover:text-emerald-400 transition-all"
                      title="ดูรายงาน / ส่งออก PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2">{p.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
              </div>

              {/* Owner & Section */}
              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {p.section.name}
                  </span>
                  <span className="text-slate-300 font-medium">หัวหน้าโครงการ: {p.owner.name}</span>
                </div>

                {/* Team Members Summary & Action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Users className="w-3.5 h-3.5" /> ทีมงาน {p.members.length} คน
                  </span>

                  {canManageTeam && (
                    <button
                      onClick={() => setActiveProjectForTeam({ id: p.id, name: p.name })}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" /> ตั้งทีมงาน ({p.members.length})
                    </button>
                  )}
                </div>

                {/* Dynamic Task-based Progress % */}
                {(() => {
                  const pTasks = tasks.filter((t: any) => t.projectId === p.id);
                  const donePTasks = pTasks.filter((t: any) => t.status === 'DONE');
                  const taskProgress = pTasks.length > 0 ? Math.round((donePTasks.length / pTasks.length) * 100) : ((p as any).progress || 0);
                  return (
                    <div className="pt-2.5 border-t border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          🎯 ความก้าวหน้า (Task):
                        </span>
                        <span className="font-extrabold text-emerald-400 font-mono">
                          {taskProgress}% ({donePTasks.length}/{pTasks.length} Tasks สำเร็จ)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(taskProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Formation Modal */}
      {activeProjectForTeam && (
        <TeamFormationModal
          projectId={activeProjectForTeam.id}
          projectName={activeProjectForTeam.name}
          isOpen={!!activeProjectForTeam}
          onClose={() => setActiveProjectForTeam(null)}
          onSaved={fetchProjectsData}
        />
      )}

      {/* Project Report / PDF Export Modal */}
      {activeProjectForReport && (
        <ProjectReportModal
          projectId={activeProjectForReport.id}
          projectName={activeProjectForReport.name}
          isOpen={!!activeProjectForReport}
          onClose={() => setActiveProjectForReport(null)}
        />
      )}

      {/* Project Modal (Add/Edit) */}
      {showPrjModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProject}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingPrjId ? 'แก้ไขโครงการ (Edit Project)' : 'สร้างโครงการใหม่ (New Project)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPrjModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">ชื่อโครงการ</label>
              <input
                type="text"
                required
                placeholder="ระบุชื่อโครงการ..."
                value={prjName}
                onChange={(e) => setPrjName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">รหัสโครงการ (Project Code)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น PRJ-DIG-01"
                  value={prjCode}
                  onChange={(e) => setPrjCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">สถานะโครงการ</label>
                <select
                  value={prjStatus}
                  onChange={(e) => setPrjStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PLANNING">PLANNING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">ส่วนงานที่รับผิดชอบ</label>
                <select
                  value={prjSecId}
                  onChange={(e) => handleModalSectionChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">ผอ.ส่วน / Project Owner</label>
                <select
                  value={prjOwnerId}
                  onChange={(e) => handleModalOwnerChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {projectOwners.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">คำอธิบายโครงการ</label>
              <textarea
                rows={3}
                placeholder="รายละเอียดขอบเขตงานและเป้าหมายโครงการ..."
                value={prjDesc}
                onChange={(e) => setPrjDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPrjModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all"
              >
                บันทึกโครงการ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
