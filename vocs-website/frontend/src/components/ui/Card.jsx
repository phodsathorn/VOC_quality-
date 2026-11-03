import React from 'react';

export default function Card({
  children,
  title = null,
  subtitle = null,
  icon = null,
  action = null,
  className = '',
  style = {},
  headerStyle = {},
  bodyStyle = {},
  noPadding = false,
  highlight = false,
  highlightColor = '#2563eb',
  ...props
}) {
  const hasHeader = Boolean(title || subtitle || icon || action);

  return (
    <div
      className={`card ${className}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: `1px solid #e2e8f0`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden',
        ...(highlight ? { borderTop: `3px solid ${highlightColor}` } : {}),
        ...style,
      }}
      {...props}
    >
      {hasHeader && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          ...headerStyle,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && (
              <div style={{
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#0f172a',
                  lineHeight: 1.3,
                }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {action && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {action}
            </div>
          )}
        </div>
      )}

      <div style={{
        padding: noPadding ? 0 : '20px',
        ...bodyStyle,
      }}>
        {children}
      </div>
    </div>
  );
}

