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
          gray: "#aace47", // Component background color (green)
        },
        background: {
          DEFAULT: "#aace47", // Main background color (green)
          light: "#c5e06f", // Lighter green
        },
      },
    },
  },
  plugins: [],
};
export default config;
