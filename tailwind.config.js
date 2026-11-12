/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ice-cream-hub reference tokens (oklch → hex).
        background: '#fff9f2',
        foreground: '#3b1d15',
        card: '#ffffff',
        'card-foreground': '#3b1d15',
        primary: '#e8477c',
        'primary-foreground': '#fefbf8',
        secondary: '#ffdbed',
        'secondary-foreground': '#472218',
        muted: '#f8ece0',
        'muted-foreground': '#72564d',
        accent: '#acefd1',
        'accent-foreground': '#472218',
        border: '#efd9cd',
        input: '#efd9cd',
        ring: '#e8477c',
        destructive: '#e7000b',
        // Warm brown-tinted neutrals replacing the stock gray scale.
        gray: {
          50: '#FBF7F3',
          100: '#F6EFE8',
          200: '#EDE3D9',
          300: '#DDD0C4',
          400: '#B5A396',
          500: '#8B7566',
          600: '#6E5A4D',
          700: '#56443A',
          800: '#3F312A',
          900: '#3B1D15',
          950: '#24120C',
        },
        // Pink primary scale replacing the stock green scale (brand accent).
        green: {
          50: '#FFF0F4',
          100: '#FFE3EA',
          200: '#FFC9D8',
          300: '#FFA3BD',
          400: '#FB7AA4',
          500: '#F4578A',
          600: '#E8477C',
          700: '#C83065',
          800: '#A82553',
          900: '#8A1F45',
          950: '#5E1330',
        },
        // Single gradient usage mirrors the pink scale.
        emerald: {
          50: '#FFF0F4',
          100: '#FFE3EA',
          200: '#FFC9D8',
          300: '#FFA3BD',
          400: '#FB7AA4',
          500: '#F4578A',
          600: '#E8477C',
          700: '#C83065',
          800: '#A82553',
          900: '#8A1F45',
          950: '#5E1330',
        },
        // red/amber/blue stay stock: errors, stars and links keep semantics.
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderColor: { DEFAULT: '#efd9cd' },
      divideColor: { DEFAULT: '#efd9cd' },
    },
  },
  plugins: [],
};
