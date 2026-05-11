module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hideout: {
          orange: "#A855F7",
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
          available: "#06B6D4",
          danger: "#A855F7",
          disabled: "#3A3F48",
        },
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "system-ui", "sans-serif"],
        heading: ["var(--font-rajdhani)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        neon: "0 0 0 1px #A855F7, 0 0 16px rgba(168,85,247,0.45), 0 0 32px rgba(200,120,255,0.25)",
        "neon-soft": "0 0 0 1px #A855F7, 0 0 8px rgba(168,85,247,0.30)",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
    },
  },
};