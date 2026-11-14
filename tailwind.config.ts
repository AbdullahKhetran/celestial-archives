import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1c1612", inverse: "#f4eadc" },
        paper: { DEFAULT: "#f3eadc", inverse: "#140f0c" },
        paper2: { DEFAULT: "#e7dccb", inverse: "#2c241c" },
        rule: { DEFAULT: "#cbbba3", inverse: "#5c4b3c" },
        gold: { DEFAULT: "#8d5a16", inverse: "#e2b56a" },
        gold2: { DEFAULT: "#f0d7a2", inverse: "#f6e6c4" },
        impact: { DEFAULT: "#8d3b2c", inverse: "#e08a7a" },
        sea: { DEFAULT: "#2f5c56", inverse: "#8fccc4" },
        muted: { DEFAULT: "#6f6256", inverse: "#c4b5a4" },
        map: { DEFAULT: "#241c16", inverse: "#0c0907" },
        surface: { DEFAULT: "#fffaf3", inverse: "#221b16" },
        control: { DEFAULT: "#ffffff", inverse: "#241c16" },
      },
      fontFamily: {
        archive: ['"Iowan Old Style"', "Palatino", '"Palatino Linotype"', "Georgia", "serif"],
        ui: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
