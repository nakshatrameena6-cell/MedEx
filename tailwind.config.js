/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medex: {
          bg: '#0B0F19',
          sidebar: '#111827',
          topbar: '#0E1626',
          surface: '#141E30',
          elevated: '#1A253B',
          hover: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          'border-active': 'rgba(6, 182, 212, 0.4)',
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
          disabled: '#475569',
          cyan: {
            DEFAULT: '#06B6D4',
            light: '#67E8F9',
            glow: 'rgba(6, 182, 212, 0.15)',
          },
          red: {
            DEFAULT: '#EF4444',
            light: '#FCA5A5',
            glow: 'rgba(239, 68, 68, 0.15)',
          },
          amber: {
            DEFAULT: '#F59E0B',
            light: '#FDE68A',
            glow: 'rgba(245, 158, 11, 0.15)',
          },
          green: {
            DEFAULT: '#10B981',
            light: '#6EE7B7',
            glow: 'rgba(16, 185, 129, 0.15)',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }], // 11px
        xs: ['0.75rem', { lineHeight: '1rem' }],           // 12px
        sm: ['0.8125rem', { lineHeight: '1.125rem' }],     // 13px
        base: ['0.875rem', { lineHeight: '1.25rem' }],     // 14px
        lg: ['1rem', { lineHeight: '1.5rem' }],            // 16px
        xl: ['1.125rem', { lineHeight: '1.75rem' }],       // 18px
        '2xl': ['1.375rem', { lineHeight: '1.875rem' }],   // 22px
      },
      boxShadow: {
        'medex-panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'medex-glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.25)',
        'medex-glow-red': '0 0 15px -3px rgba(239, 68, 68, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-in-right': 'slideInRight 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
