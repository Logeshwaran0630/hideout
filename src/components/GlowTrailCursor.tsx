"use client";

import { useEffect, useMemo, useState } from "react";

type Point = { x: number; y: number };

export default function GlowTrailCursor() {
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [trail, setTrail] = useState<Point[]>([]);
  const isTouch = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  }, []);

  useEffect(() => {
    if (isTouch) return;

    const onMove = (e: MouseEvent) => {
      const next = { x: e.clientX, y: e.clientY };
      setPosition(next);
      setVisible(true);
      setTrail((prev) => [next, ...prev].slice(0, 10));
    };

    const onLeave = () => setVisible(false);
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest("a,button,.card-premium")));
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    document.addEventListener("mouseover", onOver);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      document.removeEventListener("mouseover", onOver);
    };
  }, [isTouch]);

  if (isTouch || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[120]" aria-hidden="true">
      {trail.map((dot, index) => {
        const size = Math.max(3, 10 - index);
        const opacity = Math.max(0.06, 0.28 - index * 0.025);
        return (
          <span
            key={`${dot.x}-${dot.y}-${index}`}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: dot.x - size / 2,
              top: dot.y - size / 2,
              background: hovering ? "#EC4899" : "#A855F7",
              opacity,
              filter: "blur(0.4px)",
              transition: "left 50ms linear, top 50ms linear",
            }}
          />
        );
      })}

      <span
        className="absolute rounded-full"
        style={{
          left: position.x - (hovering ? 28 : 20),
          top: position.y - (hovering ? 28 : 20),
          width: hovering ? 56 : 40,
          height: hovering ? 56 : 40,
          border: `2px solid ${hovering ? "#EC4899" : "#A855F7"}`,
          boxShadow: `0 0 22px ${hovering ? "rgba(236,72,153,0.7)" : "rgba(168,85,247,0.7)"}`,
          opacity: 0.75,
          transition: "all 140ms ease",
        }}
      />

      <span
        className="absolute rounded-full"
        style={{
          left: position.x - 4,
          top: position.y - 4,
          width: 8,
          height: 8,
          background: hovering ? "#EC4899" : "#A855F7",
          boxShadow: "0 0 14px rgba(168,85,247,0.9)",
        }}
      />
    </div>
  );
}
