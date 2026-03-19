import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stock: "#2563eb",
        required: "#6b7280",
        shortage: "#ef4444",
        safe: "#22c55e",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
