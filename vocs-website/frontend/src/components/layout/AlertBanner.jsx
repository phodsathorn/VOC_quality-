import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function AlertBanner({
  criticalBannerAlert,
  isBannerDismissed,
  setIsBannerDismissed,
  lang,
}) {
  if (!criticalBannerAlert || isBannerDismissed) return null;

  return (
    <div className="h-8 bg-[#ba1a1a] text-white px-4 md:px-8 flex items-center justify-between text-[12px] font-medium shadow-xs shrink-0 z-30 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle size={15} className="shrink-0 animate-pulse text-white" />
        <span className="truncate">
          {criticalBannerAlert.message || criticalBannerAlert.title || 'TVOC above critical limit in Booth 1'}
        </span>
        <span className="opacity-75 shrink-0">|</span>
        <Link to="/alerts" className="underline font-semibold hover:opacity-90 ml-1 shrink-0">
          {lang === 'TH' ? 'ดูการแจ้งเตือน' : 'View alert'}
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setIsBannerDismissed(true)}
        className="hover:opacity-80 flex items-center p-0.5 ml-2 cursor-pointer"
        aria-label="Dismiss alert banner"
      >
        <X size={15} />
      </button>
    </div>
  );
}

