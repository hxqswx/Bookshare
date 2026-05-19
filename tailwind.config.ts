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
        // Brand — warm orange, like bookclubs.com
        brand: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fcd9aa",
          300: "#f9bc74",
          400: "#f59142",
          500: "#E8702A",  // primary CTA
          600: "#d45a17",
          700: "#b04514",
          800: "#8c3614",
          900: "#722e12",
        },
        // Forest green — premium reading aesthetic
        forest: {
          50:  "#f0f7f3",
          100: "#d7ece0",
          200: "#b0d9c2",
          300: "#7dbea0",
          400: "#4d9f7c",
          500: "#2D6A4F",
          600: "#24563f",
          700: "#1c4231",
          800: "#132d22",
          900: "#0b1a14",
        },
        // Warm neutrals
        cream: {
          50:  "#fffdf9",
          100: "#fdf6ec",
          200: "#faebd5",
          300: "#f5d9b0",
          400: "#efc080",
          500: "#e8a050",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans:  ["Inter", "Noto Sans SC", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "warm-gradient": "linear-gradient(135deg, #FFFDF9 0%, #FDF6EC 50%, #F5EFE0 100%)",
        "brand-gradient": "linear-gradient(135deg, #E8702A 0%, #f59142 100%)",
        "forest-gradient": "linear-gradient(135deg, #2D6A4F 0%, #4d9f7c 100%)",
      },
      boxShadow: {
        card:  "0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.08)",
        "card-hover": "0 4px 8px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.12)",
        brand: "0 8px 24px rgba(232,112,42,.35)",
      },
      animation: {
        float:  "float 4s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(var(--r,0deg))" },
          "50%": { transform: "translateY(-12px) rotate(var(--r,0deg))" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
