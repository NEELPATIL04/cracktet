import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0d599c", // Main font color (darker blue)
          light: "#00aff0", // Sub font color (light blue)
          dark: "#094a7d", // Darker shade
        },
        secondary: {
          DEFAULT: "#00aff0", // Sub font/placeholder color (light blue)
          gray: "#f8fafc", // Component background color (very light gray/white)
        },
        background: {
          DEFAULT: "#ffffff", // Main background color (white)
          light: "#f1f5f9", // Light gray
        },
      },
    },
  },
  plugins: [],
};
export default config;
