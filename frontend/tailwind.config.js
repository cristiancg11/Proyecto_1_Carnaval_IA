/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carnaval: {
          yellow: "#FFB800",
          orange: "#FF5E00",
          pink: "#FF007A",
          cyan: "#00E5FF",
          purple: "#7928CA",
          dark: "#0F172A",
          darker: "#090D16",
        }
      }
    },
  },
  plugins: [],
}
