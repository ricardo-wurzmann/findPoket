/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        dark: '#1E1D1A',
        darker: '#0F0F0D',
        background: '#F2F0EC',
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.5)',
        textDark: '#1E1D1A',
        textMuted: '#6B6660',
        green: '#22C55E',
        amber: '#D97706',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
