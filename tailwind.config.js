/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark-blue': '#02305A',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-up-delay-200': 'fadeInUp 0.8s ease-out 0.2s forwards',
        'fade-in-up-delay-400': 'fadeInUp 0.8s ease-out 0.4s forwards',
        'fade-in-up-delay-600': 'fadeInUp 0.8s ease-out 0.6s forwards',
        'fade-in-up-delay-800': 'fadeInUp 0.8s ease-out 0.8s forwards',
      },
    },
  },
  plugins: [],
};