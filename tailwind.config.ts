import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fairway: "#2f8f5b",
        rough: "#123927",
        sand: "#f1d994",
        pin: "#ef4444",
        sky: "#d8f3ff"
      },
      boxShadow: {
        glow: "0 18px 60px rgba(47, 143, 91, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
