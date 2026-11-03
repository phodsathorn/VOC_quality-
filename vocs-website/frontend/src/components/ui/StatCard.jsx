import React from 'react';

export default function StatCard({
  title,
  value,
  unit = '',
  icon = null,
  badge = null,
  subtext = null,
  progress = null, // { value: 45, max: 100, color: '#2563eb' }
  valueColor = '#0f172a',
  style = {},
  onClick = null,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: '18px 20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      <div>
        {/* Top Header: Title + Icon / Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
            {title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {badge}
            {icon && <div style={{ color: '#94a3b8' }}>{icon}</div>}
          </div>
        </div>

        {/* Value + Unit */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0' }}>
          <span style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            color: valueColor,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {value != null ? value : '—'}
          </span>
          {unit && (
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar (Optional) */}
      {progress && (
        <div style={{ margin: '8px 0 4px' }}>
          <div style={{ height: 6, width: '100%', backgroundColor: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, (progress.value / (progress.max || 100)) * 100))}%`,
              backgroundColor: progress.color || '#2563eb',
              borderRadius: 999,
            }} />
          </div>
        </div>
      )}

      {/* Subtext */}
      {subtext && (
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6, lineHeight: 1.3 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
