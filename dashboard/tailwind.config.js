/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Fonts ──────────────────────────────────────────────
      fontFamily: {
        display: ["'Bricolage Grotesque'", 'sans-serif'],
        body: ["'Plus Jakarta Sans'", 'sans-serif'],
      },

      // ── Brand Colors ───────────────────────────────────────
      colors: {
        brand: {
          DEFAULT: '#2563EB', // Royal Blue
          2: '#1d4ed8',
          hover: '#1d4ed8',
          dark: '#1e40af',
          light: '#60a5fa',
          glow: 'rgba(37,99,235,0.22)',
          bg: '#EAF2FF', // Alice Blue
          border: 'rgba(37,99,235,0.25)',
        },
        // The 5 requested palette colors
        palette: {
          royal: '#2563EB',
          prussian: '#0C1731',
          carbon: '#1D2329',
          white: '#FFFFFF',
          alice: '#EAF2FF',
        },
        prussian: {
          DEFAULT: '#0C1731',
          dark: '#080f21',
          surface: '#111f42',
          border: '#1a2c59',
          muted: '#4b6192',
          light: '#8fa8d6',
        },
        carbon: {
          DEFAULT: '#1D2329',
          light: '#2d3741',
          border: '#3b4754',
          muted: '#64748b',
        },
        alice: {
          DEFAULT: '#EAF2FF',
          dark: '#dbe8fe',
          border: '#c8dcfe',
          light: '#f4f8ff',
        },
        // Glass surfaces
        glass: {
          white: 'rgba(255,255,255,0.85)',
          'white-hov': 'rgba(255,255,255,0.96)',
          border: 'rgba(216,228,248,0.9)',
          'border-dim': 'rgba(200,215,245,0.5)',
        },
        // Background mesh
        bg: {
          root: '#EAF2FF',
          canvas: '#F4F8FD',
          sidebar: '#0C1731',
          card: '#FFFFFF',
          'mesh-1': '#EAF2FF',
          'mesh-2': '#F0F5FF',
          'mesh-3': '#E2EDFE',
        },
        // Semantic: Red
        red: {
          DEFAULT: '#ef4444',
          bg: 'rgba(239,68,68,0.08)',
          border: 'rgba(239,68,68,0.20)',
          text: '#dc2626',
        },
        // Semantic: Amber
        amber: {
          DEFAULT: '#f59e0b',
          bg: 'rgba(245,158,11,0.08)',
          border: 'rgba(245,158,11,0.22)',
          text: '#d97706',
        },
        // Semantic: Green
        green: {
          DEFAULT: '#10b981',
          bg: 'rgba(16,185,129,0.08)',
          border: 'rgba(16,185,129,0.22)',
          text: '#059669',
        },
        // Semantic: Blue
        blue: {
          DEFAULT: '#2563EB',
          bg: '#EAF2FF',
          border: 'rgba(37,99,235,0.22)',
        },
        // Semantic: Purple
        purple: {
          DEFAULT: '#8b5cf6',
          bg: 'rgba(139,92,246,0.08)',
          border: 'rgba(139,92,246,0.22)',
        },
        // Text
        text: {
          primary: '#1D2329', // Carbon Black
          secondary: '#475569',
          muted: '#64748b',
          ghost: '#94a3b8',
          royal: '#2563EB',
          prussian: '#0C1731',
          white: '#ffffff',
        },
      },

      // ── Border Radius ──────────────────────────────────────
      borderRadius: {
        r6: '6px',
        r8: '8px',
        r10: '10px',
        r12: '12px',
        r16: '16px',
        r20: '20px',
        r24: '24px',
      },

      // ── Box Shadows (glassmorphism & card elevation) ────────
      boxShadow: {
        glass: '0 4px 20px -2px rgba(12, 23, 49, 0.05), 0 1px 4px rgba(12, 23, 49, 0.03)',
        'glass-hov': '0 10px 30px -4px rgba(12, 23, 49, 0.08), 0 2px 8px rgba(12, 23, 49, 0.04)',
        'glass-lg': '0 16px 48px -6px rgba(12, 23, 49, 0.12), 0 4px 16px rgba(12, 23, 49, 0.06)',
        'brand-glow': '0 4px 16px rgba(37,99,235,0.30)',
        'brand-glow-hov': '0 6px 24px rgba(37,99,235,0.45)',
        card: '0 2px 10px -2px rgba(12, 23, 49, 0.05), 0 1px 3px rgba(12, 23, 49, 0.03)',
        'card-hov': '0 12px 28px -4px rgba(12, 23, 49, 0.09), 0 4px 10px -2px rgba(12, 23, 49, 0.04)',
      },

      // ── Sidebar Width ──────────────────────────────────────
      width: {
        sidebar: '248px',
      },
      minWidth: {
        sidebar: '248px',
      },

      // ── Animations ─────────────────────────────────────────
      keyframes: {
        'mesh-drift': {
          '0%': { backgroundPosition: '0% 0%, 100% 0%, 50% 100%, 100% 100%, center' },
          '100%': { backgroundPosition: '5% 5%, 95% 5%, 45% 95%, 95% 95%, center' },
        },
        'view-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'live-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(16,185,129,0)' },
        },
        'shadow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'mesh-drift': 'mesh-drift 20s ease-in-out infinite alternate',
        'view-in': 'view-in 0.25s cubic-bezier(0.4,0,0.2,1)',
        'live-pulse': 'live-pulse 2s ease-in-out infinite',
        'shadow-pulse': 'shadow-pulse 2.5s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
      },

      // ── Backdrop blur ──────────────────────────────────────
      backdropBlur: {
        glass: '24px',
        topbar: '20px',
      },
    },
  },
  plugins: [],
}
