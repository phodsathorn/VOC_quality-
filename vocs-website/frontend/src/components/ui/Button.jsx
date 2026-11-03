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
    sm: { padding: '5px 10px', fontSize: '0.8rem', borderRadius: 6, gap: 5 },
    md: { padding: '8px 14px', fontSize: '0.875rem', borderRadius: 8, gap: 6 },
    lg: { padding: '12px 20px', fontSize: '1rem', borderRadius: 10, gap: 8 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: '1px solid #1d4ed8',
      boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#334155',
      border: '1px solid #cbd5e1',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#2563eb',
      border: '1px solid #93c5fd',
    },
    danger: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      border: '1px solid #b91c1c',
      boxShadow: '0 1px 2px rgba(220,38,38,0.2)',
    },
    success: {
      backgroundColor: '#16a34a',
      color: '#ffffff',
      border: '1px solid #15803d',
      boxShadow: '0 1px 2px rgba(22,163,74,0.2)',
    },
    warning: {
      backgroundColor: '#f59e0b',
      color: '#ffffff',
      border: '1px solid #d97706',
      boxShadow: '0 1px 2px rgba(245,158,11,0.2)',
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

