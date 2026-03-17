/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#0a0e1a",
          surface: "#0f1525",
          card: "#141b2d",
          border: "#1e2d4a",
          accent: "#00d4ff",
          green: "#00ff9d",
          red: "#ff3366",
          yellow: "#ffcc00",
          purple: "#8b5cf6",
          text: "#e2e8f0",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "scan": "scan 3s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #00d4ff, 0 0 10px #00d4ff" },
          "100%": { boxShadow: "0 0 15px #00d4ff, 0 0 30px #00d4ff, 0 0 45px #00d4ff" },
        },
        slideIn: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(5px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      boxShadow: {
        cyber: "0 0 20px rgba(0, 212, 255, 0.2)",
        "cyber-red": "0 0 20px rgba(255, 51, 102, 0.2)",
        "cyber-green": "0 0 20px rgba(0, 255, 157, 0.2)",
      },
    },
  },
  plugins: [],
};
