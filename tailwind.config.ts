import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        seismo: {
          950: "#060911", // Deepest observatory void
          900: "#0B101E", // Midnight navy surface
          850: "#11182B", // Card background dark
          800: "#1A233D", // Elevated surface dark
          700: "#27355B", // Subtle border dark
          600: "#3B4E80", // Muted text / divider
          500: "#5B73AF", // Secondary label
          400: "#8EA3DC", // Light slate highlight
          300: "#C2D0F2", // Ice blue border / glow
          200: "#E3EAFD", // Light surface secondary
          100: "#F1F5FD", // Light card background
          50: "#F8FAFF",  // Light ivory canvas
        },
        amber: {
          glow: "#F59E0B",
          dim: "#B45309",
        },
        ice: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
        },
        crimson: {
          alert: "#EF4444",
          subtle: "#7F1D1D",
        },
        emerald: {
          stable: "#10B981",
        }
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
      },
      animation: {
        "radar-sweep": "radarSweep 6s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "drift": "drift 40s linear infinite",
      },
      keyframes: {
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        drift: {
          "0%": { transform: "translateX(0%)" },
          "50%": { transform: "translateX(-4%)" },
          "100%": { transform: "translateX(0%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
