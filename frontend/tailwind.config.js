/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "main-blue": "#2176eb",
        "main-light-blue": "#4487d2",
        "main-bg": "#f9f9f9",
        "remote-tag-border": "#56c69d",
        "remote-tag-text": "#68b89a",
        "skill-tag-bg": "#F5F6F8",
        "skill-tag-text": "#939494",
      }
    },
  },
  plugins: [],
}