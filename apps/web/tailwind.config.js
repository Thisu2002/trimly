/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  extend: {
    colors: {
      brand: {
        DEFAULT: "#2a4f7a",
        light: "#ABD5FF",
      },
    },
    boxShadow: {
      brand: "0 0 5px rgba(171,213,255,0.35)",
    },
  },
},
  plugins: [],
}