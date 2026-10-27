/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bedd',
          400: '#609ecc',
          500: '#3c82ba',
          600: '#2b689e',
          700: '#235380',
          800: '#1e4468',
          900: '#0f2642',
          950: '#0a192f',
        },
        navy: {
          800: '#111c2e',
          900: '#0c1421',
          950: '#060a12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
