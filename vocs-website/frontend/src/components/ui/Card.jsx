import React from 'react';

/**
 * Stitch AI Standard Clean-Tech Card Component
 * Conforms to Atmospheric Intelligence: 24px radius (rounded-3xl),
 * #FFFFFF resting surface, hairline 1px #E2E8F0 border, soft ambient shadow.
 */
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
  cornerGlow = false,
  ...props
}) {
  const hasHeader = Boolean(title || subtitle || icon || action);

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-3xl border border-[#e2e8f0] shadow-card transition-all duration-200 ${className}`}
      style={{
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        ...(highlight ? { borderTop: `3px solid ${highlightColor}` } : {}),
        ...style,
      }}
      {...props}
    >
      {/* Corner Ambient Glow from Atmospheric Intelligence */}
      {cornerGlow && (
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-blue-500/5 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
      )}

      {hasHeader && (
        <div
          className="flex items-center justify-between flex-wrap gap-2.5 px-6 py-4 border-b border-[#f1f5f9]"
          style={headerStyle}
        >
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="text-[#2563eb] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-[15px] font-semibold text-[#131b2e] leading-snug">
                  {title}
                </h3>
              )}
              {subtitle && (
                <div className="text-[12px] text-[#64748b] mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {action && (
            <div className="flex items-center gap-2">
              {action}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          padding: noPadding ? 0 : '1.5rem',
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
