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
          violet: "#8b5cf6",
          purple: "#7c3aed",
          fuchsia: "#d946ef",
          pink: "#ec4899",
          rose: "#f43f5e",
          amber: "#f59e0b",
          gold: "#fbbf24",
          cyan: "#06b6d4",
          teal: "#14b8a6",
          emerald: "#10b981",
          dark: "#080d1a",
          darker: "#030712",
          card: "rgba(13, 20, 36, 0.75)",
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(236, 72, 153, 0.3)',
        'glow-md': '0 0 25px -4px rgba(217, 70, 239, 0.45)',
        'glow-lg': '0 0 35px -5px rgba(139, 92, 246, 0.55)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.45)',
        'glow-cyan': '0 0 25px -4px rgba(6, 182, 212, 0.45)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}

