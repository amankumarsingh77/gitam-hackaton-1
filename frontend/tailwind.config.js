/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4361EE',
        secondary: '#3A0CA3',
        accent: '#F72585',
        highlight: '#4CC9F0',
        success: '#06D6A0',
        warning: '#FFD166',
        error: '#EF476F',
        background: '#F8F9FA',
        card: '#FFFFFF',
        textDark: '#212529',
        textMedium: '#495057',
        textLight: '#6C757D',
        border: '#DEE2E6',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
        fun: ['Comic Neue', 'cursive'],
      },
      borderRadius: {
        DEFAULT: '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      },
    },
  },
  plugins: [],
} 