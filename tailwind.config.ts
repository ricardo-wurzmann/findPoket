import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F2F0EC",
        sidebar: "#1E1D1A",
        "sidebar-border": "#2A2926",
        "sidebar-muted": "#6B6660",
        "sidebar-hover": "#252320",
        surface: "#ECEAE4",
        "surface-2": "#E5E3DC",
        border: "#D4D0C8",
        "border-dark": "#2A2926",
        text: "#1E1D1A",
        "text-muted": "#6B6660",
        "text-light": "#9B9690",
        green: {
          DEFAULT: "#1A6B45",
          light: "#E8F5EE",
          dark: "#145536",
        },
        amber: {
          DEFAULT: "#8B6914",
          light: "#FDF5E0",
          dark: "#6B5010",
        },
        red: {
          DEFAULT: "#8B1A1A",
          light: "#FDEAEA",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      borderRadius: {
        none: "0px",
        sm: "3px",
        DEFAULT: "3px",
        md: "3px",
        lg: "3px",
        xl: "3px",
        "2xl": "3px",
        "3xl": "3px",
        full: "9999px",
      },
      fontSize: {
        tag: ["9px", { letterSpacing: "0.1em", fontWeight: "500" }],
      },
      animation: {
        "card-deal": "cardDeal 0.4s ease forwards",
        "live-pulse": "livePulse 2s ease-in-out infinite",
        "major-pulse": "majorPulse 3s ease-in-out infinite",
        ticker: "ticker 30s linear infinite",
        "fade-in": "fadeIn 0.2s ease",
        "slide-up": "slideUp 0.25s ease",
      },
      keyframes: {
        cardDeal: {
          "0%": { opacity: "0", transform: "translateX(-20px) rotate(-2deg)" },
          "100%": { opacity: "1", transform: "translateX(0) rotate(0deg)" },
        },
        livePulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(26, 107, 69, 0.6)" },
          "50%": { boxShadow: "0 0 0 8px rgba(26, 107, 69, 0)" },
        },
        majorPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(30, 29, 26, 0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(30, 29, 26, 0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
