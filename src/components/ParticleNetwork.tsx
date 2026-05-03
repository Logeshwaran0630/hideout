"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  color: string;
};

const COLORS = ["#A855F7", "#C084FC", "#3B82F6", "#60A5FA", "#EC4899", "#F472B6"];

export default function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let raf = 0;
    let mouseX = 0;
    let mouseY = 0;
    let mouseActive = false;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(90, Math.floor(window.innerWidth / 18));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1.2 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        tx: Math.random() * canvas.width,
        ty: Math.random() * canvas.height,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };

    let frameCount = 0;
    const draw = () => {
      frameCount++;
      if (frameCount % 2 !== 0) {
        raf = window.requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            const opacity = 0.12 * (1 - dist / 150);
            const line = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            line.addColorStop(0, `rgba(168, 85, 247, ${opacity})`);
            line.addColorStop(1, `rgba(59, 130, 246, ${opacity})`);
            ctx.beginPath();
            ctx.strokeStyle = line;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        if (mouseActive) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            const force = ((120 - dist) / 120) * 1.2;
            const angle = Math.atan2(dy, dx);
            p.x -= Math.cos(angle) * force;
            p.y -= Math.sin(angle) * force;
          }
        }

        p.x += (p.tx - p.x) * 0.004 + p.vx;
        p.y += (p.ty - p.y) * 0.004 + p.vy;

        if (Math.random() < 0.004) {
          p.tx = Math.random() * canvas.width;
          p.ty = Math.random() * canvas.height;
          p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      raf = window.requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;
    };

    const onMouseLeave = () => {
      mouseActive = false;
    };

    const onResize = () => {
      init();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseLeave);
    window.addEventListener("resize", onResize);

    init();
    draw();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseLeave);
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 opacity-60" aria-hidden="true" />;
}
