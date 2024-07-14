/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "main-text": "#0D141C",
        "main-white-bg": "#F7FAFC",
        "dark-white": "#E8EDF2",
        "searchbar-text": "#4F7396",
        "navbar-border": "#E8EDF2"
      }
    },
  },
  plugins: [],
}