/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: "#0a0a0f",
          card: "#15151f",
          border: "#2a2a3a",
          muted: "#8b8ba0",
          purple: "#8b5cf6",
          indigo: "#4f46e5",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "nexus-gradient": "linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)",
        "logo-gradient": "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)",
      },
    },
  },
  plugins: [],
};
