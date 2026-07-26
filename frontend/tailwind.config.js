/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#080c12',
        surface:  '#0e1520',
        surface2: '#131d2b',
        border:   '#1c2d40',
        accent:   '#00d4ff',
        accent2:  '#7c3aed',
        muted:    '#5c7a96',
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
