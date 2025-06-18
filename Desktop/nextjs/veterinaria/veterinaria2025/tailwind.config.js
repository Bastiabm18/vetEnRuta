/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blue-jai': '#26336a', // Tu color personalizado no es el mismo azul pero no brilla tanto
        'blue-vet': '#3498DB', // Tu color 
        'blue-vet-light': '#AED6F1', // Tu color 
        'green-vet': '#82E0AA', // Tu color
        'green-vet-light': '#D5F5E3', // Tu color


        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        bebas: ["var(--font-bebas)", "sans-serif"],
        josefin: ["var(--font-josefin)", "sans-serif"],
        playwrite: ["var(--font-playwrite)", "sans-serif"],
        crimson: ["var(--font-crimson)", "serif"],
      },
    },
  },
   plugins: [
    require('tailwind-scrollbar-hide')
  ],
}