module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hideout: {
          orange: "#FF4500",
          amber: "#F89858",
          black: "#0A0F18",
          charcoal: "#14181F",
          slate: "#1F242C",
          smoke: "#2A2F38",
          bone: "#F5F1EA",
          ash: "#A0A6AF",
          mute: "#6B7280",
        },
        status: {
          available: "#4ADE80",
          danger: "#FF4500",
          disabled: "#3A3F48",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        heading: ["Cinzel", "serif"],
        sans: ["Rajdhani", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        neon: "0 0 0 1px #FF4500, 0 0 16px rgba(255,69,0,0.45), 0 0 32px rgba(255,87,34,0.25)",
        "neon-soft": "0 0 0 1px #FF4500, 0 0 8px rgba(255,69,0,0.30)",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
    },
  },
};