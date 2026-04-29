import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        positive: {
          bg: "#ecfdf5",
          soft: "#d1fae5",
          border: "#a7f3d0",
          text: "#047857",
          accent: "#10b981",
        },
        neutral: {
          bg: "#fffbeb",
          soft: "#fef3c7",
          border: "#fde68a",
          text: "#b45309",
          accent: "#f59e0b",
        },
        negative: {
          bg: "#fff1f2",
          soft: "#ffe4e6",
          border: "#fecdd3",
          text: "#be123c",
          accent: "#f43f5e",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)",
        pop: "0 8px 24px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "hero-grad":
          "radial-gradient(60% 80% at 0% 0%, rgba(99,102,241,0.10), transparent 60%), radial-gradient(50% 70% at 100% 0%, rgba(236,72,153,0.08), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
