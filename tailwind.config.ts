import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f7f8fb",
        ink: "#172033",
        muted: "#64748b",
        line: "#d9e1ea",
        brand: {
          50: "#eef8ff",
          100: "#d8efff",
          500: "#2081c3",
          600: "#1769a3",
          700: "#155985"
        },
        mint: {
          50: "#edfdf5",
          100: "#d3f8e4",
          500: "#1f9d72",
          600: "#147d5a"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
