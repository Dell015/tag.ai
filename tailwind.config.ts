import type { Config } from "tailwindcss";

const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: rgb("bg"),
        surface: rgb("surface"),
        elevated: rgb("elevated"),
        ink: rgb("ink"),
        muted: rgb("muted"),
        accent: rgb("accent"),
        accent2: rgb("accent-2"),
        wild: rgb("wild"),
        gold: rgb("gold"),
        ok: rgb("ok"),
        danger: rgb("danger"),
      },
      fontFamily: {
        display: ["'Bricolage Grotesque Variable'", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["'Inter Variable'", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "28px",
        sheet: "32px",
      },
      minHeight: { tap: "3.5rem" },
      minWidth: { tap: "3.5rem" },
      height: { tap: "3.5rem", cta: "4rem" },
      boxShadow: {
        card: "0 24px 60px -18px rgb(0 0 0 / 0.7), 0 2px 0 0 rgb(255 255 255 / 0.06) inset",
        glow: "0 0 0 1px rgb(var(--accent) / 0.5), 0 10px 40px -8px rgb(var(--accent) / 0.55)",
        wild: "0 0 0 1px rgb(var(--wild) / 0.5), 0 10px 50px -8px rgb(var(--wild) / 0.7)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))",
        "wild-gradient": "linear-gradient(135deg, rgb(var(--wild)), #C026D3)",
        "heat-gradient": "linear-gradient(90deg, #4A90E8, #34D399, #FACC15, #FB923C, #FF4D6D)",
      },
      keyframes: {
        "heart-bounce": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.5)" },
          "50%": { transform: "scale(0.9)" },
          "75%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "pulse-red": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(255 77 109 / 0.5)" },
          "50%": { boxShadow: "0 0 0 14px rgb(255 77 109 / 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-12px) scale(.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "heart-bounce": "heart-bounce 0.6s ease-out",
        "pulse-red": "pulse-red 0.9s ease-out infinite",
        float: "float 4s ease-in-out infinite",
        "toast-in": "toast-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
