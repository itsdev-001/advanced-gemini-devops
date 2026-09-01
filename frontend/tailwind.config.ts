import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gemini: {
          dark: "#131314",
          darker: "#0e0e10",
          surface: "#1e1f20",
          hover: "#282a2c",
          border: "#333538",
          blue: "#1a73e8",
          accent: "#4285f4",
          purple: "#9b72cf"
        }
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-in-out",
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    },
  },
  plugins: [],
};
export default config;