import type { Config } from "tailwindcss";

/**
 * Utilby design system — "Playful Color" (direction B).
 * - Neutrals (`slate`) are re-tuned to a soft violet-grey so every existing component picks them up.
 * - `indigo` is re-tuned to the Utilby violet accent.
 * - `ink` is the near-black used for primary buttons and headings.
 * - Each tool category has its own color (`pdf`, `img`, `txt`, `dev`, `sec`, `calc`) + a soft tint.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#16141F", soft: "#2E2B3B" },
        slate: {
          50: "#FAF9FD",
          100: "#F4F2FA",
          200: "#ECEAF3",
          300: "#DCD8E7",
          400: "#A6A1B8",
          500: "#6F6A84",
          600: "#57536A",
          700: "#454255",
          800: "#2E2B3B",
          900: "#16141F",
          950: "#0E0D14",
        },
        indigo: {
          50: "#F3F0FF",
          100: "#E9E3FF",
          200: "#D5CBFF",
          300: "#B7A7FF",
          400: "#9B85FF",
          500: "#7B5CFF",
          600: "#5B3FE0",
          700: "#4A31BD",
          800: "#3B2896",
          900: "#2F2277",
          950: "#1C1447",
        },
        brand: {
          50: "#F3F0FF",
          100: "#E9E3FF",
          500: "#7B5CFF",
          600: "#5B3FE0",
          700: "#4A31BD",
        },
        sun: { DEFAULT: "#FFC53D", soft: "#FFF4D6" },
        pdf: { DEFAULT: "#FF5A36", soft: "#FFF0EC" },
        img: { DEFAULT: "#2F9BFF", soft: "#EAF4FF" },
        txt: { DEFAULT: "#B6E33B", soft: "#F3FBE3" },
        dev: { DEFAULT: "#9B85FF", soft: "#F1EEFF" },
        sec: { DEFAULT: "#19C39B", soft: "#E7F8F2" },
        calc: { DEFAULT: "#FFC53D", soft: "#FFF6DD" },
      },
      fontFamily: {
        sans: ["'DM Sans Variable'", "'DM Sans'", "system-ui", "-apple-system", "'Segoe UI'", "Roboto", "sans-serif"],
        display: ["'Bricolage Grotesque Variable'", "'Bricolage Grotesque'", "'DM Sans Variable'", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(22,20,31,0.04), 0 1px 1px rgba(22,20,31,0.02)",
        lift: "0 20px 50px -24px rgba(22,20,31,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pop-in": "pop-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
