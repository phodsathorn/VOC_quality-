import React from 'react';

export default function PageHeader({
  title,
  subtitle = null,
  icon = null,
  badge = null,
  actions = null,
  style = {},
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 24,
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon && (
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              margin: 0,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p style={{
              margin: '3px 0 0',
              fontSize: '0.85rem',
              color: '#64748b',
              lineHeight: 1.4,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
