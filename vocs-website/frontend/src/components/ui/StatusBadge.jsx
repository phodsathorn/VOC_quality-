import React from 'react';

/**
 * Standard Status Badge with animated or solid pulse dot
 * e.g., Online, Offline, Active, In Progress, Resolved, Standby
 */
export default function StatusBadge({
  status = 'active',
  label,
  dot = true,
  size = 'md',
  className = '',
}) {
  const normalized = (status || '').toString().toLowerCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (['online', 'active', 'good', 'operational', 'running', 'normal', 'nominal', 'success'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    dotColor = 'bg-emerald-500';
  } else if (['warning', 'in-progress', 'in_progress', 'pending', 'standby', 'rebooting'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
    dotColor = 'bg-amber-500';
  } else if (['offline', 'critical', 'danger', 'breached', 'failed', 'high'].includes(normalized)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
    dotColor = 'bg-rose-500';
  } else if (['resolved', 'closed', 'completed', 'verified'].includes(normalized)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200/80';
    dotColor = 'bg-blue-500';
  }

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[11px] font-medium'
    : 'px-2.5 py-0.5 text-[12px] font-semibold';

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`${dotSize} rounded-full shrink-0 ${dotColor}`} />}
      <span>{label || status}</span>
    </span>
  );
}

