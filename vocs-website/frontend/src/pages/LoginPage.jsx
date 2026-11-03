import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wind, Lock, Eye, EyeOff, Loader2, AlertTriangle
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
      setFormError('Please enter username and password');
      return;
    }

    const res = await login(username.trim(), password.trim());
    if (res.success) {
      const role = res.user?.role || 'operator';
      const landing = { admin: '/', engineer: '/', operator: '/kiosk', viewer: '/emissions' };
      navigate(landing[role] || '/');
    } else {
      setFormError(res.error || 'Invalid credentials');
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
    <main className="w-full min-h-screen bg-[#faf8ff] flex items-center justify-center p-8">
      <div className="flex flex-col w-full items-center justify-center min-h-[calc(100vh-4rem)] relative overflow-hidden py-12">
        {/* Soft Ambient Background Elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#dbe1ff]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#d3e4fe]/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-[400px] bg-white rounded-[24px] shadow-sm p-8 sm:p-10 flex flex-col items-center border border-[#dae2fd]/60">
          {/* Brand Logo & Telemetry Mark */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#f2f3ff] flex items-center justify-center text-[#2563eb] mb-3 shadow-xs">
              <Wind size={28} />
            </div>
            <div className="text-[20px] font-bold text-[#131b2e] tracking-tight leading-none">
              VOC / E-Nose
            </div>
            <div className="text-[12px] tracking-[0.2em] uppercase font-bold text-[#505f76] mt-1.5">
              Telemetry System
            </div>
          </div>

          {/* Title */}
          <div className="w-full text-left mb-6">
            <h1 className="text-[20px] font-semibold text-[#131b2e]">
              Sign in
            </h1>
          </div>

          {/* Cold-start notification */}
          {coldStartNotice && (
            <div className="w-full mb-4 p-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] text-[12px] flex items-center gap-2 animate-fadeIn">
              <Loader2 size={16} className="animate-spin shrink-0 text-[#f59e0b]" />
              <span>Connecting to cloud backend...</span>
            </div>
          )}

          {/* Form Error */}
          {(formError || error) && (
            <div className="w-full mb-4 p-3 rounded-xl bg-[#ffdad6]/50 border border-[#ffdad6] text-[#ba1a1a] text-[12px] flex items-center gap-2 animate-fadeIn">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{formError || error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#434655] font-medium text-[12px] uppercase tracking-wider" htmlFor="username">
                Username
              </label>
              <div className="relative w-full">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your ID or email"
                  autoComplete="username"
                  className="w-full h-11 px-4 text-[#131b2e] placeholder:text-[#737686] bg-[#f2f3ff] rounded-xl text-[14px] outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#434655] font-medium text-[12px] uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <div className="relative w-full flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 pl-4 pr-11 text-[#131b2e] placeholder:text-[#737686] bg-[#f2f3ff] rounded-xl text-[14px] outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-[#505f76] hover:text-[#131b2e] transition-colors flex items-center justify-center cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-[#2563eb] hover:bg-[#004ac6] text-white font-medium text-[14px] rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
            </button>

            {/* Role Selection Quick Pills */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className="px-3 py-1 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] text-[12px] font-semibold rounded-full transition-all duration-150 cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('engineer')}
                className="px-3 py-1 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] text-[12px] font-semibold rounded-full transition-all duration-150 cursor-pointer"
              >
                Engineer
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('operator')}
                className="px-3 py-1 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] text-[12px] font-semibold rounded-full transition-all duration-150 cursor-pointer"
              >
                Operator
              </button>
            </div>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[12px] text-[#505f76]">
          <Lock size={14} />
          <span>Authorized personnel only. Activity is logged.</span>
        </div>
      </div>
    </main>
  );
}
