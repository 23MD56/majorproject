/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/frontend/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#7C3AED",
          hover: "#6D28D9",
          dim: "rgba(124, 58, 237, 0.12)",
          secondary: "#6366F1",
        },
        profit: {
          DEFAULT: "#10B981",
          hover: "#059669",
          dim: "rgba(16, 185, 129, 0.12)",
        },
        loss: {
          DEFAULT: "#EB5B3C",
          hover: "#DC2626",
          dim: "rgba(235, 91, 60, 0.12)",
        },
        surface: {
          light: "#FFFFFF",
          "light-subtle": "#F8FAFC",
          dark: "#121124",
          "dark-subtle": "#181730",
        },
      },
      borderRadius: {
        "squircle-sm": "16px",
        "squircle-md": "20px",
        "squircle-lg": "24px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};
