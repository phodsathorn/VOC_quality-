import React, { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, X, User, MoreVertical, Volume2, VolumeX, LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { toggleSoundEnabled } from '../../utils/soundAlert';

export default function SidebarNav({
  navItems = [],
  user,
  logout,
  soundActive,
  setSoundActive,
  onClose,
}) {
  const location = useLocation();
  const { t, isThai } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#f1f5f9] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center text-white shadow-sm">
            <Activity size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight text-[#131b2e] leading-tight">
              VOC / E-Nose
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b]">
              Telemetry System
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-[#64748b] hover:bg-[#f1f5f9]"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Items (Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {navItems.map((item, idx) => {
          const prevItem = navItems[idx - 1];
          const showMoreHeader = item.isMore && (!prevItem || !prevItem.isMore);
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Fragment key={item.path}>
              {showMoreHeader && (
                <div className="pt-3 pb-1 px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    {t('more', 'More')}
                  </span>
                </div>
              )}
              <Link
                to={item.path}
                onClick={onClose ? onClose : undefined}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#e2e7ff] text-[#004ac6] font-semibold shadow-xs'
                    : 'text-[#434655] hover:bg-[#eaedff]/60 hover:text-[#131b2e]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={18} className={isActive ? 'text-[#004ac6]' : 'text-[#64748b]'} />
                  <span className="truncate">{t(item.key, item.name)}</span>
                </div>

                {item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            </Fragment>
          );
        })}
      </nav>

      {/* Bottom User Profile Card */}
      <div className="p-3 border-t border-[#eaedff] flex items-center justify-between shrink-0 relative">
        <div
          onClick={() => setShowUserMenu((prev) => !prev)}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
          title={isThai ? 'คลิกเพื่อจัดการโปรไฟล์และการตั้งค่า' : 'Click to manage profile and settings'}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setShowUserMenu((prev) => !prev);
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[#004ac6] text-white flex items-center justify-center shrink-0">
            <User size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium text-[#131b2e] truncate leading-tight">
              {isThai
                ? user?.full_name === 'System Administrator'
                  ? 'ผู้ดูแลระบบ'
                  : user?.full_name || 'ผู้ดูแลระบบ'
                : user?.full_name || 'System Administrator'}
            </span>
            <span className="text-[11px] text-[#505f76] truncate leading-none mt-0.5">
              {isThai
                ? user?.role === 'H&S Officer' || user?.role === 'admin'
                  ? 'เจ้าหน้าที่ความปลอดภัย (จป.)'
                  : user?.role || 'เจ้าหน้าที่ความปลอดภัย (จป.)'
                : user?.role || 'H&S Officer'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowUserMenu((prev) => !prev)}
          className="text-[#505f76] hover:text-[#131b2e] p-1.5 rounded-lg hover:bg-[#eaedff]/50 transition-colors"
          title="User settings"
        >
          <MoreVertical size={18} />
        </button>

        {/* User Context Dropdown */}
        {showUserMenu && (
          <div className="absolute bottom-14 left-2 right-2 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-[#f1f5f9] mb-1">
              <p className="text-[12px] font-semibold text-[#131b2e]">
                {isThai
                  ? user?.full_name === 'System Administrator'
                    ? 'ผู้ดูแลระบบ'
                    : user?.full_name || 'E. Mitchell'
                  : user?.full_name || 'E. Mitchell'}
              </p>
              <p className="text-[10px] text-[#64748b]">
                {isThai ? 'โรงงานหลัก' : 'Main Plant'} • {isThai ? 'เจ้าหน้าที่ความปลอดภัย (จป.)' : 'H&S Officer'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = toggleSoundEnabled();
                setSoundActive(next);
              }}
              className="w-full px-3 py-2 text-left text-[12px] text-[#131b2e] hover:bg-[#f8fafc] rounded-lg flex items-center justify-between"
            >
              <span>{t('soundNotifications', 'Sound Notifications')}</span>
              {soundActive ? (
                <Volume2 size={15} className="text-[#059669]" />
              ) : (
                <VolumeX size={15} className="text-[#64748b]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full px-3 py-2 text-left text-[12px] text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-lg flex items-center gap-2 mt-1"
            >
              <LogOut size={15} />
              <span>{t('logout', 'Log out')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

