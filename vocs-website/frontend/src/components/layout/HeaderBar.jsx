import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Activity, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function HeaderBar({
  setMobileMenuOpen,
  isDeviceOnline,
  activeAlertsCount,
}) {
  const { t, isThai, lang, setLang } = useLanguage();

  return (
    <header className="sticky top-0 z-10 h-16 bg-white/90 backdrop-blur-md border-b border-[#e2e8f0] px-3 sm:px-4 md:px-8 flex items-center justify-between shadow-xs gap-2">
      {/* Left: Mobile Toggle + Location & Gateway Status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl text-[#131b2e] hover:bg-[#f1f5f9] shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Location Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 sm:px-3.5 py-1.5 rounded-full border border-[#e2e8f0] shadow-xs min-w-0 max-w-[150px] xs:max-w-[210px] sm:max-w-none">
          <Activity size={15} className="text-[#004ac6] shrink-0" />
          <span className="text-[12px] sm:text-[13px] font-medium text-[#131b2e] truncate">
            {t('location', 'Powder Coating Booth 1')}
          </span>
        </div>

        {/* Hardware Gateway Online / Offline Pill */}
        {isDeviceOnline ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isThai ? 'ออนไลน์' : 'ONLINE'}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px] font-semibold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>{isThai ? 'ออฟไลน์' : 'OFFLINE'}</span>
          </div>
        )}
      </div>

      {/* Right: Updated time + Language toggle + Notifications Bell */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <span className="hidden md:inline-block text-[12px] font-medium text-[#505f76] select-none">
          {t('updated', 'Updated')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>

        {/* TH/EN toggle */}
        <div className="flex items-center p-0.5 bg-[#eaedff] rounded-full text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setLang('TH')}
            className={`px-2 py-0.5 rounded-full transition-colors ${
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
            className={`px-2 py-0.5 rounded-full transition-colors ${
              lang === 'EN'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            EN
          </button>
        </div>

        {/* Notifications Bell */}
        <Link
          to="/alerts"
          title="Notifications"
          className="relative p-2 rounded-full hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] transition-colors flex items-center justify-center"
        >
          <Bell size={20} />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]" />
          )}
        </Link>
      </div>
    </header>
  );
}

