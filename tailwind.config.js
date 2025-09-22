/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          25: '#FFFBF5',
          50: '#FFF6EC',
          100: '#FFE8CF',
          200: '#FED2A3',
          300: '#F8B06B',
          400: '#EE8A33',
          500: '#E26A12',
          600: '#C2500C',
          700: '#963C0D',
          800: '#6B2B0E',
          900: '#4A1E0C'
        },
        sand: {
          25: '#FDFCF9',
          50: '#F9F5EF',
          100: '#F1E9DC',
          200: '#E3D4BE',
          300: '#D0B899',
          400: '#B99676',
          500: '#9F7A5C',
          600: '#805D42',
          700: '#604430',
          800: '#3E2C1F',
          900: '#21170F'
        },
        moss: {
          50: '#EEF8F4',
          100: '#D5F0E3',
          200: '#A8DFC6',
          300: '#74C7A3',
          400: '#4CAC84',
          500: '#2E8C67',
          600: '#1F6F51',
          700: '#165842',
          800: '#124536',
          900: '#0C2C24'
        }
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 45px -25px rgba(226, 106, 18, 0.45)',
        panel: '0 20px 40px -24px rgba(24, 32, 44, 0.35)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      spacing: {
        18: '4.5rem'
      }
    },
  },
  plugins: [],
};
