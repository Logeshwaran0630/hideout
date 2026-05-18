"use client";

type HexCrestProps = {
  size?: "small" | "large";
  showHorns?: boolean;
  className?: string;
};

export default function HexCrest({ size = "large", showHorns = true, className = "" }: HexCrestProps) {
  const dimensions = size === "large" ? "w-32 h-32" : "w-10 h-10";

  return (
    <div className={`relative ${dimensions} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_18px_rgba(0,212,160,0.18)]">
        <defs>
          <linearGradient id="hexFire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6600" />
            <stop offset="100%" stopColor="#cc2200" />
          </linearGradient>
          <linearGradient id="ghostAura" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4a0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00d4a0" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <polygon
          points="50 5, 85 25, 85 75, 50 95, 15 75, 15 25"
          fill="rgba(5,5,8,0.55)"
          stroke="url(#hexFire)"
          strokeWidth="2.5"
        />

        {showHorns ? (
          <>
            <path d="M35 10 Q27 -5 20 -12 Q30 -7 42 6" fill="#ff5200" opacity="0.95" />
            <path d="M65 10 Q73 -5 80 -12 Q70 -7 58 6" fill="#ff5200" opacity="0.95" />
          </>
        ) : null}

        <path d="M28 37 L72 67" stroke="#cc2200" strokeWidth="2" opacity="0.8" />
        <path d="M35 42 L65 62" stroke="#ff5200" strokeWidth="1.2" opacity="0.45" />

        <polygon
          points="50 5, 85 25, 85 75, 50 95, 15 75, 15 25"
          fill="none"
          stroke="url(#ghostAura)"
          strokeWidth="1.5"
          opacity="0.65"
          className="animate-pulse"
        />

        <text
          x="50"
          y="41"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontFamily="Orbitron, sans-serif"
          fontWeight="900"
          letterSpacing="1"
        >
          THE
        </text>
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill="#ff5200"
          fontSize="11"
          fontFamily="Orbitron, sans-serif"
          fontWeight="900"
          letterSpacing="1"
        >
          HIDEOUT
        </text>
      </svg>
    </div>
  );
}
