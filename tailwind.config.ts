import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#e8eef8", inverse: "#e8eef8" },
        paper: { DEFAULT: "#070c16", inverse: "#070c16" },
        paper2: { DEFAULT: "#101826", inverse: "#101826" },
        rule: { DEFAULT: "#2a3648", inverse: "#2a3648" },
        gold: { DEFAULT: "#60a5fa", inverse: "#60a5fa" },
        gold2: { DEFAULT: "#dbeafe", inverse: "#dbeafe" },
        impact: { DEFAULT: "#f0a04b", inverse: "#f0a04b" },
        sea: { DEFAULT: "#93c5fd", inverse: "#93c5fd" },
        muted: { DEFAULT: "#9aa8bc", inverse: "#9aa8bc" },
        map: { DEFAULT: "#0b1018", inverse: "#0b1018" },
        surface: { DEFAULT: "#121a2b", inverse: "#121a2b" },
        control: { DEFAULT: "#0e1626", inverse: "#0e1626" },
        marker: {
          lander: "#3b82f6",
          rover: "#2dd4bf",
          impact: "#f0a04b",
          experiment: "#a78bfa",
        },
      },
      fontFamily: {
        archive: ["ui-sans-serif", "system-ui", "sans-serif"],
        ui: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
