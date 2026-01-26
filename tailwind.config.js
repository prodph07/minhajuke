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
          purple: 'var(--theme-primary, #b026ff)',
          green: 'var(--theme-secondary, #00ff41)',
          dark: 'var(--theme-background, #0f0f0f)',
        }
      }
    },
  },
  plugins: [],
}
