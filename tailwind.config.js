/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: '#b026ff',
          green: '#00ff41',
          dark: '#0f0f0f', 
        }
      }
    },
  },
  plugins: [],
}
