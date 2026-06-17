/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {

        gray: { ...defaultTheme.colors.zinc },
        slate: { ...defaultTheme.colors.zinc }, 

        blue: { ...defaultTheme.colors.indigo },
      },
      boxShadow: {

        'soft': '0 1px 3px rgba(0,0,0,0.02), 0 6px 12px rgba(0,0,0,0.01), 0 12px 24px rgba(0,0,0,0.015)',
        'soft-lg': '0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.02), 0 16px 32px rgba(0,0,0,0.03)',
      }
    },
  },
  plugins: [],
}