import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#1a1a2e",
        panel: "#16213e",
        neon: "#e94560",
        cyan: "#00d9ff",
        muted: "#9aa0b4",
        success: "#3ddc97",
        warn: "#ffb703",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 24px rgba(233, 69, 96, 0.35)",
        cyan: "0 0 24px rgba(0, 217, 255, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
