'use client';

import React, { useState } from 'react';
import { useAuth, UserProfile } from '@/lib/auth-context';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ArrowRight,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export default function LoginForm() {
  const { usersList, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setErrorMsg('อีเมลหรือรหัสผ่านไม่ถูกต้อง โปรดตรวจสอบข้อมูลอีกครั้ง');
      }
    } catch (e) {
      setErrorMsg('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (user: UserProfile) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(user.email, user.password || '123456');
    } catch (e) {
      console.error('Quick login failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find sample users for Quick Login Demo Buttons
  const superAdminUser = usersList.find((u) => u.role?.key === 'SUPER_ADMIN') || usersList[0];
  const advisorUser = usersList.find((u) => u.role?.key === 'ADVISOR') || usersList[1];
  const pmUser = usersList.find((u) => u.role?.key === 'PROJECT_OWNER') || usersList[2];
  const scrumUser = usersList.find((u) => u.role?.key === 'SCRUM_MASTER') || usersList[3];
  const staffUser = usersList.find((u) => u.role?.key === 'STAFF') || usersList[4];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch z-10">
        {/* Left Side: Brand & Role Selection Info */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl flex flex-col justify-between space-y-6 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Project Management System</h2>
                <span className="text-xs text-blue-400 font-semibold">ระบบบริหารโครงการและกำหนดสิทธิ์ผู้ใช้งาน</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              เข้าสู่ระบบเพื่อปฏิบัติงานตามบทบาทหน้าที่ และการเข้าถึงหน้าเมนูตาม **สิทธิ์การมองเห็นและการแก้ไข (Role-Based Access Control)** ที่ได้รับอนุญาต
            </p>
          </div>

          {/* Quick Demo Login Preset Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              ⚡ ทางลัดเข้าสู่ระบบทดสอบตามสิทธิ์บทบาท:
            </span>

            <div className="space-y-2">
              {superAdminUser && (
                <button
                  onClick={() => handleQuickLogin(superAdminUser)}
                  className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-purple-500/30 hover:border-purple-500/60 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={superAdminUser.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-purple-500/40"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        👑 {superAdminUser.name}
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-extrabold">SUPER_ADMIN</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">สิทธิ์เต็ม: แดชบอร์ด, โครงการ, Sprint, Kanban, Master Data, บริหารสิทธิ์</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              )}

              {pmUser && (
                <button
                  onClick={() => handleQuickLogin(pmUser)}
                  className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-blue-500/30 hover:border-blue-500/60 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={pmUser.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=PM'}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-blue-500/40"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        💼 {pmUser.name}
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-extrabold">PROJECT_OWNER</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">สิทธิ์: รายการโครงการ, Sprint Board, Kanban Board</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              )}

              {staffUser && (
                <button
                  onClick={() => handleQuickLogin(staffUser)}
                  className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={staffUser.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff'}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-emerald-500/40"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        👷 {staffUser.name}
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-extrabold">STAFF</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">สิทธิ์: ปฏิบัติงานบน Kanban Board เฉพาะงานที่ได้รับมอบหมาย</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Login Form */}
        <div className="bg-slate-900 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">เข้าสู่ระบบ (Sign In)</h3>
            <p className="text-xs text-slate-400">กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานตามสิทธิ์ของคุณ</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-500/40 p-3.5 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" /> อีเมล / Username
              </label>
              <input
                type="email"
                required
                placeholder="ระบุอีเมล เช่น admin@demo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" /> รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="ระบุรหัสผ่าน (เช่น 123456)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Log In)'}</span>
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">
              รหัสผ่านเริ่มต้นของพนักงานทุกคนในระบบคือ <strong className="text-blue-400 font-mono">123456</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
