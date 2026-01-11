/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4c1d95',
        'action': '#f97316',
        'success': '#10b981',
        'bg-main': '#f3f4f6',
        'text-base': '#1f2937',
        'bg-dark': '#312e81',
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}