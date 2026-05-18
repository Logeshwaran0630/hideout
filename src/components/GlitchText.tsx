"use client";

type GlitchTextProps = {
  text: string;
  className?: string;
  highlight?: boolean;
};

export default function GlitchText({ text, className = "", highlight = false }: GlitchTextProps) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className={`${highlight ? "text-[#FF4500] glow-text" : "text-white"}`}>{text}</span>
      <span className="pointer-events-none absolute inset-0 text-[#FF5722] opacity-60 [clip-path:inset(0_0_55%_0)] animate-[glitchOne_350ms_infinite]">
        {text}
      </span>
      <span className="pointer-events-none absolute inset-0 text-[#FF5722] opacity-60 [clip-path:inset(45%_0_0_0)] animate-[glitchTwo_350ms_infinite]">
        {text}
      </span>
    </span>
  );
}
