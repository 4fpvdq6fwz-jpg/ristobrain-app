/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#ff8c5a',
          500: '#ff6b35',
          600: '#f25c26',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        dark: {
          900: '#0f1115',
          800: '#171a21',
          700: '#1f2430',
          600: '#2a3140',
          500: '#394356',
          400: '#4b556b',
          300: '#7d8798',
          200: '#a8b1c0',
          100: '#d9dee6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.25), 0 8px 24px rgba(0,0,0,.18)',
        brand: '0 6px 18px rgba(255,107,53,.25)',
      },
      keyframes: {
        fadeup: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        slideup: { from: { opacity: '.4', transform: 'translateY(32px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        fadeup: 'fadeup .28s ease-out',
        slideup: 'slideup .25s ease-out',
      },
    },
  },
  plugins: [],
};
