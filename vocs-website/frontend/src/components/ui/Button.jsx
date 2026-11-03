import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Button({
  children,
  variant = 'secondary', // primary | secondary | outline | danger | success | warning | ghost
  size = 'md',           // sm | md | lg
  iconLeft = null,
  iconRight = null,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  style = {},
  className = '',
  title = '',
  ...props
}) {
  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '0.8rem', borderRadius: 10, gap: 6 },
    md: { padding: '9px 16px', fontSize: '0.875rem', borderRadius: 12, gap: 8 },
    lg: { padding: '12px 24px', fontSize: '1rem', borderRadius: 14, gap: 10 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: '1px solid #1d4ed8',
      boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#131b2e',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#2563eb',
      border: '1px solid #2563eb',
    },
    danger: {
      backgroundColor: '#ba1a1a',
      color: '#ffffff',
      border: '1px solid #93000a',
      boxShadow: '0 2px 8px rgba(186,26,26,0.25)',
    },
    success: {
      backgroundColor: '#00CC66',
      color: '#ffffff',
      border: '1px solid #00b359',
      boxShadow: '0 2px 8px rgba(0,204,102,0.25)',
    },
    warning: {
      backgroundColor: '#FFD100',
      color: '#131b2e',
      border: '1px solid #e6bc00',
      boxShadow: '0 2px 8px rgba(255,209,0,0.25)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#64748b',
      border: '1px solid transparent',
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variantStyles[variant] || variantStyles.secondary;

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      title={title}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.65 : 1,
        transition: 'all 0.15s ease',
        ...currentSize,
        ...currentVariant,
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <RefreshCw size={size === 'sm' ? 13 : 16} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        iconLeft
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </button>
  );
}

