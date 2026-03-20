/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#7c6af7', dark: '#6254d4', light: '#a89cf9' },
        surface: { DEFAULT: '#13161e', 2: '#1a1e28', 3: '#252936' },
        border: '#252936',
      },
      fontFamily: { mono: ['var(--font-mono)', 'Fira Code', 'monospace'] },
    },
  },
  plugins: [],
}
