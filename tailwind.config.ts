import type { Config } from 'tailwindcss';

export default {
  content: ['./entrypoints/**/*.{ts,tsx,html}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ["'Instrument Serif'", 'Georgia', "'Times New Roman'", 'serif'],
        body: ["'DM Sans'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Courier New'", 'monospace'],
      },
      colors: {
        primary: { DEFAULT: '#1B4965', light: '#2A6A8E', dark: '#5CB8E8' },
        accent: { DEFAULT: '#E8734A', light: '#F0906E', dark: '#F0906E', glow: 'rgba(232,115,74,0.15)', 'glow-dark': 'rgba(240,144,110,0.2)' },
        reward: { DEFAULT: '#FFB020', light: '#FFF4D6' },
        streak: { DEFAULT: '#FF6B35', dark: '#FF8555' },
        success: { DEFAULT: '#22C55E', light: '#ECFDF5', dark: '#4ADE80' },
        error: { DEFAULT: '#EF4444', light: '#FEF2F2', dark: '#F87171' },
        warning: { DEFAULT: '#F59E0B', light: '#FFFBEB', dark: '#FBBF24' },
        info: { DEFAULT: '#3B82F6', light: '#EFF6FF', dark: '#60A5FA' },
        cream: { bg: '#FAFAF8', surface: '#FFFFFF', alt: '#F3F2EE', border: '#E5E3DD' },
        ink: { DEFAULT: '#1A1A1A', muted: '#6B6860', light: '#9B978E' },
        warm: {
          bg: '#0C0A09', surface: '#1C1917', alt: '#292524',
          border: '#3D3835', text: '#F5F0EA', muted: '#A8A29E', light: '#78716C',
        },
      },
      fontSize: {
        micro: ['11px', { lineHeight: '1.3' }],
        xs: ['12px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.4' }],
        base: ['14px', { lineHeight: '1.5' }],
        md: ['16px', { lineHeight: '1.6' }],
        lg: ['20px', { lineHeight: '1.3' }],
        xl: ['24px', { lineHeight: '1.2' }],
        '2xl': ['32px', { lineHeight: '1.15' }],
        '3xl': ['48px', { lineHeight: '1.1' }],
      },
      spacing: {
        '2xs': '2px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(26,26,26,0.06)',
        md: '0 4px 12px rgba(26,26,26,0.08)',
        lg: '0 8px 32px rgba(26,26,26,0.12)',
        'dark-sm': '0 1px 3px rgba(0,0,0,0.2)',
        'dark-md': '0 4px 12px rgba(0,0,0,0.3)',
        'dark-lg': '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'streak-pulse': 'streak-pulse 1s ease-in-out infinite',
        'xp-appear': 'xp-appear 300ms ease-out',
        'modal-enter': 'modal-enter 250ms ease-out',
        'success-pulse': 'success-pulse 200ms ease-out',
        shimmer: 'shimmer 600ms ease-in-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 1px 3px rgba(26,26,26,0.06), 0 0 0 rgba(232,115,74,0)' },
          '50%': { boxShadow: '0 1px 3px rgba(26,26,26,0.06), 0 0 20px rgba(232,115,74,0.15)' },
        },
        'streak-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        'xp-appear': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'modal-enter': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'success-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(200%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
