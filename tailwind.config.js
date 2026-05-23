module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "devil-orange": "#FF5200",
        "devil-red": "#CC2200",
        "ghost-teal": "#00D4A0",
        "dark-bg": "#050508",
        "card-bg": "#0A0F18",
        border: "rgba(255, 82, 0, 0.3)",
        hideout: {
          orange: "#FF5200",
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
          available: "#22C55E",
          danger: "#FF5200",
          disabled: "#3A3F48",
          warning: "#F59E0B",
          error: "#EF4444",
          cyan: "#00D4A0",
          blue: "#3B82F6",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        heading: ["Orbitron", "sans-serif"],
        sans: ["Nunito Sans", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        cinzel: ["Cinzel", "serif"],
        orbitron: ["Orbitron", "sans-serif"],
        rajdhani: ["Nunito Sans", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 0 1px #FF5200, 0 0 16px rgba(255,82,0,0.45), 0 0 32px rgba(204,34,0,0.25)",
        "neon-soft": "0 0 0 1px #FF5200, 0 0 8px rgba(255,82,0,0.30)",
        "devil-glow": "0 4px 20px rgba(255,82,0,0.4), 0 0 20px rgba(255,82,0,0.2)",
        "card-hover": "0 0 30px rgba(255,82,0,0.08)",
      },
      borderRadius: {
        card: "16px",
        button: "8px",
      },
      backgroundImage: {
        "grad-primary": "linear-gradient(135deg, #ff5200 0%, #cc2200 100%)",
        "grad-hover": "linear-gradient(135deg, #ff6600 0%, #ff3300 100%)",
        "grad-progress": "linear-gradient(90deg, #ff5200 0%, #ff6600 50%, #cc2200 100%)",
      },
    },
  },
};
