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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        'heart-bounce': {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.4)' },
          '50%': { transform: 'scale(0.9)' },
          '75%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'toast-fade-in': {
          '0%': { opacity: '0', transform: 'translate(-50%, 4px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        'pulse-red': {
          '0%, 100%': { borderColor: 'rgb(239 68 68)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '50%': { borderColor: 'rgb(220 38 38)', boxShadow: '0 0 12px 4px rgba(239, 68, 68, 0.3)' },
        },
      },
      animation: {
        'heart-bounce': 'heart-bounce 0.6s ease-out',
        'toast-fade-in': 'toast-fade-in 0.2s ease-out',
        'pulse-red': 'pulse-red 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
