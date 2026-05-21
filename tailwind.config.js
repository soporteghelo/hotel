/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        libre: '#22c55e',
        ocupada: '#ef4444',
        reservada: '#eab308',
        mantenimiento: '#6b7280',
      }
    },
  },
  plugins: [],
}
