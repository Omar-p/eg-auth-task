/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#F04E23",
          secondary: "#F36C2D", 
          accent: "#F89B33",
          coral: "#FF6F61",
          pastel: "#FFD580",
        },
        text: {
          primary: "#2E2E2E",
          secondary: "#6F6F6F",
        },
        success: "#28A745",
        warning: "#FFC107",
        error: "#DC3545",
        info: "#17A2B8",
      },
    },
  },
  plugins: [],
}