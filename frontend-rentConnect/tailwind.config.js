/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enable class-based dark mode
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#000000", // black for light mode text and accents
          DEFAULT: "#000000",
          dark: "#ffffff", // white for dark mode text and accents
        },
        background: {
          light: "#ffffff", // white background in light mode
          dark: "#000000", // black background in dark mode
        },
      },
    },
  },
  plugins: [],
};
