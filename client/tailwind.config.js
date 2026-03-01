/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: "#00f5ff",
          purple: "#bf00ff",
          green: "#00ff88",
          pink: "#ff006e",
        },
        glass: "rgba(255,255,255,0.05)",
        dark: {
          900: "#0a0a0f",
          800: "#12121a",
          700: "#1a1a25",
          600: "#252532",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 245, 255, 0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 245, 255, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
