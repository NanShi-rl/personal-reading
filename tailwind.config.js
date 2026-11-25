/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      // Flat, sharp corners (Mosby's Files uses ~4px radii)
      borderRadius: {
        md: '3px',
        lg: '4px',
        xl: '4px',
        '2xl': '6px',
        '3xl': '8px',
      },
      colors: {
        // Neutral near-black scale; slate-950 is the page background (#191919)
        slate: {
          50: '#f5f4f1',
          100: '#ebe9e4',
          200: '#d6d4ce',
          300: '#b4b2ac',
          400: '#8f8d88',
          500: '#76746f',
          600: '#5a5955',
          700: '#3a3a38',
          800: '#2a2a2a',
          900: '#212121',
          950: '#191919',
        },
        // Primary accent: Mosby blue (#1E4BD7)
        brand: {
          50: '#eef2fd',
          100: '#dbe4fb',
          200: '#b5c6f7',
          300: '#8aa4f2',
          400: '#6c8cf0',
          500: '#3d66e6',
          600: '#1e4bd7',
          700: '#173aa8',
          800: '#122d82',
          900: '#0d2060',
          950: '#0a1642',
        },
        mosby: {
          blue: '#1e4bd7',
          red: '#d71e1e',
          green: '#0c7866',
          purple: '#581e70',
          yellow: '#ffe927',
          black: '#000000',
          paper: '#fffdf9',
        },
      },
    },
  },
  plugins: [],
};
