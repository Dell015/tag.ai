import type { Config } from "tailwindcss";

const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: rgb("bg"),
        panel: rgb("panel"),
        raised: rgb("raised"),
        line: rgb("line"),
        text: rgb("text"),
        muted: rgb("muted"),
        accent: rgb("accent"),
        onaccent: rgb("on-accent"),
        danger: rgb("danger"),
        ok: rgb("ok"),
      },
      fontFamily: {
        sans: ["'Archivo Variable'", "system-ui", "sans-serif"],
        display: ["'Archivo Variable'", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "22px", sheet: "28px" },
      minHeight: { tap: "3rem" },
      minWidth: { tap: "3rem" },
      height: { tap: "3rem", cta: "3.5rem" },
      width: { tap: "3rem" },
      keyframes: {
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "toast-in": "toast-in 0.2s ease-out" },
    },
  },
  plugins: [],
};
export default config;
