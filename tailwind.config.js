/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg0: 'var(--bg0)',
        bg1: 'var(--bg1)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        bg4: 'var(--bg4)',
        bghov: 'var(--bghov)',
        accent: 'var(--ac)',
        accentLight: 'var(--acl)',
        accentDark: 'var(--acd)',
        accentGlow: 'var(--acg)',
        t1: 'var(--t1)',
        t2: 'var(--t2)',
        t3: 'var(--t3)',
        t4: 'var(--t4)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Fira Code', 'monospace'],
      },
      keyframes: {
        cpFadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        cpSlideDown: {
          'from': { opacity: '0', transform: 'translateY(-12px) scale(0.98)' },
          'to': { opacity: '1', transform: 'none' },
        }
      },
      animation: {
        'cp-fade-in': 'cpFadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        'cp-slide-down': 'cpSlideDown 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    },
  },
  plugins: [],
}
