import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // ISECS Academy brand palette
        brand: {
          DEFAULT: "#2596e8", // primary blue
          50: "#eef8ff",
          100: "#d9eefe",
          200: "#b8e0fd",
          300: "#86ccfb",
          400: "#4db1f6",
          500: "#2596e8",
          600: "#1578c7",
          700: "#1360a1",
          800: "#155185",
          900: "#16456e",
        },
        gold: {
          DEFAULT: "#b8942f", // secondary accent
          50: "#fbf7ec",
          100: "#f5ecd0",
          200: "#ecd8a1",
          300: "#e0be6c",
          400: "#d3a748",
          500: "#b8942f",
          600: "#977525",
          700: "#775a20",
          800: "#63491f",
          900: "#543d1e",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
