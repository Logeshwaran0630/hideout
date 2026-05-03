"use client";

const floatingItems = ["CTRL", "FPS", "XP", "P1"];

export default function FloatingElements() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {floatingItems.map((item, idx) => (
        <span
          key={item + idx}
          className="absolute text-sm font-bold tracking-widest text-[#A855F7]/15 will-change-transform"
          style={{
            left: `${15 + (idx * 25)}%`,
            top: `${20 + (idx % 3) * 30}%`,
            animation: `floatUp ${16 + (idx % 3) * 4}s linear ${idx * 1.5}s infinite`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
