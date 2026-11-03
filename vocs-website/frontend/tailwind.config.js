/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Atmospheric Intelligence Theme Palette
        'surface': '#faf8ff',
        'surface-dim': '#d2d9f4',
        'surface-bright': '#faf8ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f3ff',
        'surface-container': '#eaedff',
        'surface-container-high': '#e2e7ff',
        'surface-container-highest': '#dae2fd',
        'surface-variant': '#dae2fd',
        'surface-tint': '#0053db',

        'on-surface': '#131b2e',
        'on-surface-variant': '#434655',
        'inverse-surface': '#283044',
        'inverse-on-surface': '#eef0ff',

        'outline': '#737686',
        'outline-variant': '#c3c6d7',

        'primary': '#004ac6',
        'on-primary': '#ffffff',
        'primary-container': '#2563eb',
        'on-primary-container': '#eeefff',
        'inverse-primary': '#b4c5ff',
        'primary-fixed': '#dbe1ff',
        'primary-fixed-dim': '#b4c5ff',
        'on-primary-fixed': '#00174b',
        'on-primary-fixed-variant': '#003ea8',

        'secondary': '#505f76',
        'on-secondary': '#ffffff',
        'secondary-container': '#d0e1fb',
        'on-secondary-container': '#54647a',
        'secondary-fixed': '#d3e4fe',
        'secondary-fixed-dim': '#b7c8e1',
        'on-secondary-fixed': '#0b1c30',
        'on-secondary-fixed-variant': '#38485d',

        'tertiary': '#943700',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#bc4800',
        'on-tertiary-container': '#ffede6',
        'tertiary-fixed': '#ffdbcd',
        'tertiary-fixed-dim': '#ffb596',
        'on-tertiary-fixed': '#360f00',
        'on-tertiary-fixed-variant': '#7d2d00',

        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        'background': '#faf8ff',
        'on-background': '#131b2e',

        // Air4Thai PCD 5-Level Telemetry Colors
        'telemetry-very-good': '#00C0FF',
        'telemetry-good': '#00CC66',
        'telemetry-moderate': '#FFD100',
        'telemetry-unhealthy': '#FF7E00',
        'telemetry-hazardous': '#FF0000',

        // Clean Tech Surfaces
        'canvas': '#F8FAFC',
        'card-surface': '#FFFFFF',
        'border-hairline': '#E2E8F0',
      },
      borderRadius: {
        'sm': '0.5rem',
        'DEFAULT': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        'full': '9999px',
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        'space-2xl': '3rem',
        'gutter': '1.5rem',
        'margin': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'display-metric': ['Inter', 'Noto Sans Thai', 'sans-serif'],
        'metric-large': ['Inter', 'Noto Sans Thai', 'sans-serif'],
        'headline-sm': ['Inter', 'Noto Sans Thai', 'sans-serif'],
        'card-label': ['Inter', 'Noto Sans Thai', 'sans-serif'],
        'body-default': ['Inter', 'Noto Sans Thai', 'sans-serif'],
        'body-medium': ['Inter', 'Noto Sans Thai', 'sans-serif'],
        'detail-link': ['Inter', 'Noto Sans Thai', 'sans-serif'],
        'badge-label': ['Inter', 'Noto Sans Thai', 'sans-serif'],
      },
      fontSize: {
        'display-metric': ['56px', { lineHeight: '60px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'metric-large': ['44px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'card-label': ['14px', { lineHeight: '20px', letterSpacing: '0.05em', fontWeight: '500' }],
        'body-default': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'detail-link': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'badge-label': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'flyout': '0 12px 32px -4px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'sidebar': '0 1px 8px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

