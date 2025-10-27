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
          DEFAULT: "#ff6b35",
          light: "#ff8c61",
          dark: "#e55525",
        },
        secondary: {
          DEFAULT: "#ffffff",
          gray: "#f5f5f5",
        },
      },
    },
  },
  plugins: [],
};
export default config;
