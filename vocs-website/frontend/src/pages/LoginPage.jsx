import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Lock, User, Eye, EyeOff, ArrowRight, Loader2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [coldStartNotice, setColdStartNotice] = useState(false);

  // ตรวจจับ Render cold-start (ฟรีเซิร์ฟเวอร์ปลุกตัวนาน)
  useEffect(() => {
    let t;
    if (loading) {
      t = setTimeout(() => setColdStartNotice(true), 3500);
    } else {
      setColdStartNotice(false);
    }
    return () => clearTimeout(t);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!username.trim() || !password.trim()) {
      setFormError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    const res = await login(username.trim(), password.trim());
    if (res.success) {
      const role = res.user?.role || 'operator';
      const landing = { admin: '/', engineer: '/', operator: '/kiosk', viewer: '/emissions' };
      navigate(landing[role] || '/');
    } else {
      setFormError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleQuickRole = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('Admin@Voc2026!');
    } else if (role === 'engineer') {
      setUsername('engineer');
      setPassword('Engineer@Voc2026!');
    } else {
      setUsername('operator');
      setPassword('Operator@Voc2026!');
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#faf8ff] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Pastel Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#dbe1ff]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#d3e4fe]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-[0_4px_25px_rgba(15,23,42,0.06)] border border-[#e2e8f0] p-8 sm:p-10 flex flex-col items-center">
        {/* Brand Logo & Telemetry Mark */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#eaedff] flex items-center justify-center text-[#2563eb] mb-3 shadow-xs">
            <Activity size={26} />
          </div>
          <div className="text-[20px] font-bold text-[#131b2e] tracking-tight leading-tight">
            VOC / E-Nose Platform
          </div>
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#64748b] mt-1">
            Telemetry & Safety System
          </div>
        </div>

        {/* Cold-start Notice */}
        {coldStartNotice && (
          <div className="w-full mb-4 p-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] text-[12px] flex items-center gap-2 animate-fadeIn">
            <Loader2 size={16} className="animate-spin shrink-0 text-[#f59e0b]" />
            <span>กำลังปลุกเซิร์ฟเวอร์คลาวด์ (Cold-Start) โปรดรอสักครู่...</span>
          </div>
        )}

        {/* Error Notice */}
        {(formError || error) && (
          <div className="w-full mb-4 p-3 rounded-xl bg-[#ffdad6]/40 border border-[#ffdad6] text-[#ba1a1a] text-[12px] flex items-center gap-2 animate-fadeIn">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{formError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-user"
              className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider"
            >
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative w-full flex items-center">
              <User size={18} className="absolute left-3.5 text-[#64748b] pointer-events-none" />
              <input
                id="login-user"
                type="text"
                required
                autoFocus
                autoComplete="username"
                placeholder="กรอกชื่อผู้ใช้ เช่น admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-[#131b2e] placeholder:text-[#94a3b8] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[14px] outline-none transition-all focus:bg-white focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-pass"
              className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider"
            >
              รหัสผ่าน (Password)
            </label>
            <div className="relative w-full flex items-center">
              <Lock size={18} className="absolute left-3.5 text-[#64748b] pointer-events-none" />
              <input
                id="login-pass"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-11 text-[#131b2e] placeholder:text-[#94a3b8] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[14px] outline-none transition-all focus:bg-white focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-[#64748b] hover:text-[#131b2e] transition-colors"
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.35)] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Quick Role Fill Pills */}
          <div className="flex flex-col items-center gap-2 pt-3 border-t border-[#f1f5f9] mt-1">
            <span className="text-[11px] text-[#64748b]">เลือกระบบทดสอบด่วน (Quick Demo Roles):</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className="px-3 py-1 bg-[#f8fafc] hover:bg-[#eaedff] text-[#434655] hover:text-[#004ac6] border border-[#e2e8f0] text-[11px] font-semibold rounded-full transition-all cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('engineer')}
                className="px-3 py-1 bg-[#f8fafc] hover:bg-[#eaedff] text-[#434655] hover:text-[#004ac6] border border-[#e2e8f0] text-[11px] font-semibold rounded-full transition-all cursor-pointer"
              >
                Engineer
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('operator')}
                className="px-3 py-1 bg-[#f8fafc] hover:bg-[#eaedff] text-[#434655] hover:text-[#004ac6] border border-[#e2e8f0] text-[11px] font-semibold rounded-full transition-all cursor-pointer"
              >
                Operator
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
