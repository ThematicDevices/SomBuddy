/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#fad1da',
          300: '#f6abbe',
          400: '#ef7899',
          500: '#e44d77',
          600: '#d02d5f',
          700: '#ae214c',
          800: '#8e1f43',
          900: '#722f37',
          950: '#430d1c',
        },
        gold: {
          50: '#fdfaeb',
          100: '#faf2c9',
          200: '#f6e38e',
          300: '#f0cf53',
          400: '#eabc2a',
          500: '#d4af37',
          600: '#b4821f',
          700: '#905f1d',
          800: '#774c1f',
          900: '#653f20',
          950: '#3a1f0f',
        },
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#2a2a2a',
          950: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
