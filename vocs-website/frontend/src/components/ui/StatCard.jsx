import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Stitch AI Standard Telemetry Metric Card Component
 * Conforms to Atmospheric Intelligence:
 * - 24px radius, pure white #FFFFFF
 * - Slate-500 uppercase header (14px, +0.05em tracking)
 * - 44px–56px bold tabular figures (display-metric, tnum)
 * - Air4Thai status pip (6px–8px)
 * - Optional bottom "View details →" link
 */
export default function StatCard({
  title,
  value,
  unit = '',
  icon = null,
  badge = null,
  subtext = null,
  progress = null, // { value: 45, max: 100, color: '#2563eb' }
  valueColor = '#0f172a',
  onDetailClick = null,
  detailLabel = 'View details',
  className = '',
  style = {},
  onClick = null,
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white rounded-3xl p-6 border border-[#e2e8f0] flex flex-col justify-between transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md' : ''
      } ${className}`}
      style={{
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        minHeight: '190px',
        ...style,
      }}
    >
      {/* Top Ambient Glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-[#64748b] uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge}
          {icon && <div className="text-[#64748b]">{icon}</div>}
        </div>
      </div>

      {/* Main Metric Figure (Tabular Numbers) */}
      <div className="flex items-baseline gap-2 my-2">
        <span
          className="text-[44px] md:text-[50px] font-bold text-[#0f172a] leading-none tracking-tight tabular-nums"
          style={{ color: valueColor }}
        >
          {value != null ? value : '—'}
        </span>
        {unit && (
          <span className="text-[14px] font-medium text-[#64748b]">
            {unit}
          </span>
        )}
      </div>

      {/* Middle Optional Bar */}
      {progress && (
        <div className="my-1.5">
          <div className="h-1.5 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, (progress.value / (progress.max || 100)) * 100))}%`,
                backgroundColor: progress.color || '#2563eb',
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom Row: Subtext or "View details →" */}
      <div className="flex items-center justify-between mt-auto pt-2 text-[13px]">
        {subtext ? (
          <span className="text-[#64748b] text-[12px] leading-tight">
            {subtext}
          </span>
        ) : <span />}

        {onDetailClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDetailClick();
            }}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors group"
          >
            <span>{detailLabel}</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
