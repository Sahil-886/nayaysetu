import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0F182E',
          900: '#12203C',
          800: '#1B2A4A',
          700: '#2A3B5C',
          600: '#3D5075',
          100: '#E8ECF4',
          50: '#F0F4FA',
        },
        brass: {
          900: '#684F1E',
          800: '#86682B',
          700: '#A4813A',
          600: '#C6A15B',
          500: '#D7B46F',
          400: '#E5C788',
          200: '#F5E8C9',
          100: '#FAF4E8',
          50: '#FCF9F2',
        },
        ink: {
          900: '#20293A',
          800: '#334155',
          700: '#475569',
          600: '#5B6472',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
        },
        surface: {
          card: '#FFFFFF',
          bg: '#F7F8FA',
          subtle: '#F1F5F9',
          border: '#E2E8F0',
          borderDark: '#CBD5E1',
        },
        legal: {
          green: '#2C7A4B',
          greenLight: '#E8F5EE',
          greenBorder: '#A3D9B5',
          red: '#C53030',
          redLight: '#FFF5F5',
        },
      },
      fontFamily: {
        serif: ['Cambria', 'Source Serif Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

