import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wind, Lock, Eye, EyeOff, Loader2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [coldStartNotice, setColdStartNotice] = useState(false);
  const loadingTimerRef = useRef(null);

  useEffect(() => {
    if (loading) {
      loadingTimerRef.current = setTimeout(() => {
        setColdStartNotice(true);
      }, 3500);
    } else {
      clearTimeout(loadingTimerRef.current);
    }
    return () => clearTimeout(loadingTimerRef.current);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!username.trim() || !password.trim()) {
      setFormError(t('enterUserPass'));
      return;
    }

    const res = await login(username.trim(), password.trim());
    if (res.success) {
      const role = res.user?.role || 'operator';
      const landing = { admin: '/', engineer: '/', operator: '/kiosk', viewer: '/emissions' };
      navigate(landing[role] || '/');
    } else {
      setFormError(res.error || t('invalidCredentials'));
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
    <main className="w-full min-h-screen bg-[#faf8ff] flex items-center justify-center p-6 relative">
      {/* Top right language switch pill */}
      <div className="absolute top-6 right-6 z-20">
        <div className="inline-flex items-center p-0.5 rounded-full bg-[#eaedff] border border-[#dbe1ff] text-[11px] font-semibold shadow-xs">
          <button
            type="button"
            onClick={() => setLang('TH')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              lang === 'TH'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            TH
          </button>
          <button
            type="button"
            onClick={() => setLang('EN')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              lang === 'EN'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="flex flex-col w-full items-center justify-center min-h-[calc(100vh-4rem)] relative overflow-hidden py-12">
        {/* Soft Ambient Background Elements matching Stitch 1:1 */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#dbe1ff]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#d3e4fe]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-[400px] bg-white rounded-[24px] shadow-sm p-8 sm:p-10 flex flex-col items-center border border-[#eaedff]">
          {/* Brand Logo & Telemetry Mark matching Stitch 1:1 */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#f2f3ff] flex items-center justify-center text-[#2563eb] mb-3 shadow-sm">
              <Wind size={28} />
            </div>
            <div className="text-[20px] font-semibold text-[#131b2e] tracking-tight leading-none">
              VOC / E-Nose
            </div>
            <div className="text-[12px] tracking-[0.2em] uppercase font-semibold text-[#505f76] mt-1.5">
              Telemetry System
            </div>
          </div>

          {/* Title */}
          <div className="w-full text-left mb-6">
            <h1 className="text-[20px] font-semibold text-[#131b2e]">
              {t('signInTitle')}
            </h1>
          </div>

          {/* Cold-start notification */}
          {coldStartNotice && (
            <div className="w-full mb-4 p-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] text-[12px] flex items-center gap-2 animate-fadeIn">
              <Loader2 size={16} className="animate-spin shrink-0 text-[#f59e0b]" />
              <span>{t('connectingBackend')}</span>
            </div>
          )}

          {/* Form Error */}
          {(formError || error) && (
            <div className="w-full mb-4 p-3 rounded-xl bg-[#ffdad6]/50 border border-[#ffdad6] text-[#ba1a1a] text-[12px] flex items-center gap-2 animate-fadeIn">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{formError || error}</span>
            </div>
          )}

          {/* Authentication Form matching Stitch 1:1 */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#434655] font-medium text-[12px] uppercase tracking-wider" htmlFor="username">
                {t('usernameLabel')}
              </label>
              <div className="relative w-full">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('usernamePlaceholder')}
                  autoComplete="username"
                  className="w-full h-11 px-4 text-[#131b2e] placeholder:text-[#737686] bg-[#f2f3ff] rounded-xl text-[14px] outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#434655] font-medium text-[12px] uppercase tracking-wider" htmlFor="password">
                {t('passwordLabel')}
              </label>
              <div className="relative w-full flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : t('signInBtn')}
            </button>

            {/* Role Selection Quick Pills */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className="px-3 py-1 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] text-[12px] font-semibold rounded-full transition-all duration-150 cursor-pointer"
              >
                {t('roleAdminName').split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('engineer')}
                className="px-3 py-1 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] text-[12px] font-semibold rounded-full transition-all duration-150 cursor-pointer"
              >
                {t('roleEngineerName').split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('operator')}
                className="px-3 py-1 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] text-[12px] font-semibold rounded-full transition-all duration-150 cursor-pointer"
              >
                {t('roleOperatorName').split(' ')[0]}
              </button>
            </div>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[12px] text-[#505f76]">
          <Lock size={14} />
          <span>{t('authorizedOnlyNotice')}</span>
        </div>
      </div>
    </main>
  );
}
