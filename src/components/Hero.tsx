"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
};

type LightString = {
  start: Point;
  control: Point;
  end: Point;
};

type Bulb = Point & {
  color: string;
  phase: number;
  speed: number;
  isTipBulb?: boolean;
  tipSpeed?: number;
};

const chaserDotSize = 9;
const chaserDotCount = 40;
const chaserLoopDuration = 2500;
const bulbColors = ["#a855f7", "#7c3aed", "#c084fc", "#6d28d9"];

function getPerimeterPoint(distance: number, width: number, height: number) {
  const perimeter = 2 * (width + height);
  const normalized = ((distance % perimeter) + perimeter) % perimeter;

  if (normalized < width) {
    return { x: normalized, y: 0 };
  }

  if (normalized < width + height) {
    return { x: width, y: normalized - width };
  }

  if (normalized < 2 * width + height) {
    return { x: width - (normalized - width - height), y: height };
  }

  return { x: 0, y: height - (normalized - 2 * width - height) };
}

function getBezierPoint(string: LightString, t: number) {
  const inverseT = 1 - t;

  return {
    x:
      inverseT * inverseT * string.start.x +
      2 * inverseT * t * string.control.x +
      t * t * string.end.x,
    y:
      inverseT * inverseT * string.start.y +
      2 * inverseT * t * string.control.y +
      t * t * string.end.y,
  };
}

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logoWrapper = logoWrapperRef.current;
    const canvas = canvasRef.current;
    if (!logoWrapper || !canvas) return;

    let chaserAnimationId = 0;
    let canvasAnimationId = 0;
    let resizeTimeout: number | undefined;

    const initLogoChaser = () => {
      window.cancelAnimationFrame(chaserAnimationId);

      const rect = logoWrapper.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const perimeter = 2 * (width + height);
      const spacing = perimeter / chaserDotCount;

      logoWrapper.querySelectorAll(".logo-chaser-dot").forEach((dot) => dot.remove());

      const dots = Array.from({ length: chaserDotCount }, (_, index) => {
        const dot = document.createElement("span");
        const isCyan = index % 10 === 0; // Every 10th dot is cyan (10%)

        dot.className = "logo-chaser-dot";
        dot.style.opacity = index % 2 === 0 ? "0.5" : "1";
        dot.style.background = isCyan ? "#22d3ee" : "#a855f7";
        dot.style.boxShadow = isCyan
          ? "0 0 8px #22d3ee, 0 0 18px #22d3ee, 0 0 35px #06b6d4"
          : "0 0 8px #a855f7, 0 0 18px #a855f7, 0 0 35px #c084fc, 0 0 60px rgba(168,85,247,0.4)";

        logoWrapper.appendChild(dot);
        return dot;
      });

      const startedAt = performance.now();

      const animate = (now: number) => {
        const progress = ((now - startedAt) % chaserLoopDuration) / chaserLoopDuration;
        const offset = progress * perimeter;

        dots.forEach((dot, index) => {
          const point = getPerimeterPoint(index * spacing + offset, width, height);
          dot.style.left = `${point.x - chaserDotSize / 2}px`;
          dot.style.top = `${point.y - chaserDotSize / 2}px`;
        });

        chaserAnimationId = window.requestAnimationFrame(animate);
      };

      chaserAnimationId = window.requestAnimationFrame(animate);
    };

    const initHangingLights = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      window.cancelAnimationFrame(canvasAnimationId);

      const pixelRatio = window.devicePixelRatio || 1;
      const displayWidth = canvas.offsetWidth;
      const displayHeight = canvas.offsetHeight;

      canvas.width = Math.max(1, Math.floor(displayWidth * pixelRatio));
      canvas.height = Math.max(1, Math.floor(displayHeight * pixelRatio));
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const strings: LightString[] = [
        {
          start: { x: 0, y: 20 },
          control: { x: displayWidth * 0.5, y: 220 },
          end: { x: displayWidth, y: 25 },
        },
        {
          start: { x: 0, y: 50 },
          control: { x: displayWidth * 0.5, y: 180 },
          end: { x: displayWidth, y: 55 },
        },
        {
          start: { x: 0, y: 10 },
          control: { x: displayWidth * 0.5, y: 280 },
          end: { x: displayWidth, y: 15 },
        },
        {
          start: { x: 0, y: 70 },
          control: { x: displayWidth * 0.5, y: 160 },
          end: { x: displayWidth, y: 65 },
        },
        {
          start: { x: 0, y: 35 },
          control: { x: displayWidth * 0.5, y: 250 },
          end: { x: displayWidth, y: 40 },
        },
        {
          start: { x: 0, y: 5 },
          control: { x: displayWidth * 0.5, y: 320 },
          end: { x: displayWidth, y: 8 },
        },
      ];

      const bulbs: Bulb[] = [];

      // ADD BULBS ON HORIZONTAL STRINGS
      strings.forEach((string, stringIndex) => {
        const bulbCount = 28 + (stringIndex % 5);

        for (let index = 0; index < bulbCount; index++) {
          const point = getBezierPoint(string, index / (bulbCount - 1));
          const isCyan = (index + 1) % 5 === 0;

          bulbs.push({
            ...point,
            color: isCyan ? "#22d3ee" : bulbColors[(index + stringIndex) % bulbColors.length],
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random(),
          });
        }
      });

      const draw = (now: number) => {
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // AMBIENT FLOOR GLOW — depth layer back
        const grad = ctx.createRadialGradient(
          displayWidth / 2, displayHeight * 0.6, 0,
          displayWidth / 2, displayHeight * 0.6, displayWidth * 0.35
        );
        grad.addColorStop(0, "rgba(139,92,246,0.08)");
        grad.addColorStop(0.5, "rgba(99,60,180,0.04)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, displayHeight * 0.35, displayWidth, displayHeight * 0.65);

        // BACK LAYER — very dim distant lights
        const backStrings: LightString[] = [
          {
            start: { x: displayWidth * 0.15, y: 40 },
            control: { x: displayWidth * 0.5, y: 180 },
            end: { x: displayWidth * 0.85, y: 35 },
          },
          {
            start: { x: displayWidth * 0.05, y: 60 },
            control: { x: displayWidth * 0.5, y: 240 },
            end: { x: displayWidth * 0.95, y: 55 },
          },
        ];

        backStrings.forEach((string) => {
          ctx.beginPath();
          ctx.moveTo(string.start.x, string.start.y);
          ctx.quadraticCurveTo(string.control.x, string.control.y, string.end.x, string.end.y);
          ctx.strokeStyle = "rgba(139,92,246,0.12)";
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 0;
          ctx.stroke();

          // Back layer bulbs — very dim, small
          for (let t = 0; t <= 1; t += 0.15) {
            const point = getBezierPoint(string, t);
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#a855f7";
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // MID LAYER — main horizontal strings
        strings.forEach((string) => {
          ctx.beginPath();
          ctx.moveTo(string.start.x, string.start.y);
          ctx.quadraticCurveTo(string.control.x, string.control.y, string.end.x, string.end.y);
          ctx.strokeStyle = "rgba(139,92,246,0.25)";
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.stroke();
        });

        // VERTICAL CURTAIN LIGHTS — explicit coordinates with increased spacing
        const verticalStrings = [
          // LEFT SIDE — spaced further apart
          {
            x0: 20,
            y0: 0,
            x1: 25,
            y1: displayHeight * 0.65,
            cx: 8,
          },
          {
            x0: 70,
            y0: 0,
            x1: 65,
            y1: displayHeight * 0.5,
            cx: 55,
          },
          {
            x0: 120,
            y0: 0,
            x1: 128,
            y1: displayHeight * 0.72,
            cx: 105,
          },
          {
            x0: 170,
            y0: 0,
            x1: 163,
            y1: displayHeight * 0.45,
            cx: 155,
          },
          // RIGHT SIDE — spaced further apart
          {
            x0: displayWidth - 20,
            y0: 0,
            x1: displayWidth - 25,
            y1: displayHeight * 0.65,
            cx: displayWidth - 8,
          },
          {
            x0: displayWidth - 70,
            y0: 0,
            x1: displayWidth - 65,
            y1: displayHeight * 0.5,
            cx: displayWidth - 55,
          },
          {
            x0: displayWidth - 120,
            y0: 0,
            x1: displayWidth - 128,
            y1: displayHeight * 0.72,
            cx: displayWidth - 105,
          },
          {
            x0: displayWidth - 170,
            y0: 0,
            x1: displayWidth - 163,
            y1: displayHeight * 0.45,
            cx: displayWidth - 155,
          },
        ];

        verticalStrings.forEach((s, stringIdx) => {
          const midY = (s.y0 + s.y1) / 2;
          const stringLength = Math.sqrt(
            Math.pow(s.x1 - s.x0, 2) + Math.pow(s.y1 - s.y0, 2)
          );

          // Draw wire
          ctx.beginPath();
          ctx.moveTo(s.x0, s.y0);
          ctx.quadraticCurveTo(s.cx, midY, s.x1, s.y1);
          ctx.strokeStyle = "rgba(139,92,246,0.35)";
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.stroke();

          // Draw bulbs along the string (10 bulbs)
          for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const bx = (1 - t) * (1 - t) * s.x0 + 2 * (1 - t) * t * s.cx + t * t * s.x1;
            const by = (1 - t) * (1 - t) * s.y0 + 2 * (1 - t) * t * midY + t * t * s.y1;

            // Flicker
            const phase = (s.x0 + i) * 1.7;
            const flicker = 0.7 + 0.3 * Math.sin((now / 1000) * 1.2 + phase);

            // Color
            const colors = ["#a855f7", "#7c3aed", "#c084fc", "#9333ea"];
            const col = i % 5 === 0 ? "#22d3ee" : colors[i % 4];

            ctx.globalAlpha = flicker;
            ctx.shadowColor = i % 5 === 0 ? "#22d3ee" : "#a855f7";

            // Bottom tip bulb — bigger
            if (i === 10) {
              ctx.shadowBlur = 28;
              ctx.fillStyle = "#c084fc";
              ctx.beginPath();
              ctx.arc(bx, by, 7, 0, Math.PI * 2);
              ctx.fill();
              // Inner bright core
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(bx, by, 3, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.shadowBlur = 14;
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.arc(bx, by, 4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1.0;
          }
        });

        // FRONT LAYER — premium center focal point
        const centerString: LightString = {
          start: { x: displayWidth * 0.1, y: 5 },
          control: { x: displayWidth * 0.5, y: 260 },
          end: { x: displayWidth * 0.9, y: 5 },
        };

        ctx.beginPath();
        ctx.moveTo(centerString.start.x, centerString.start.y);
        ctx.quadraticCurveTo(
          centerString.control.x,
          centerString.control.y,
          centerString.end.x,
          centerString.end.y
        );
        ctx.strokeStyle = "rgba(168,85,247,0.5)";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Center string bulbs — bright and prominent
        for (let t = 0; t <= 1; t += 0.1) {
          const point = getBezierPoint(centerString, t);
          const phase = t * Math.PI * 2;
          const flicker = 0.8 + 0.2 * Math.sin((now / 1000) * 0.8 + phase);

          ctx.globalAlpha = flicker;
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 20;
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // DRAW ALL BULBS from horizontal strings
        bulbs.forEach((bulb) => {
          const opacity = bulb.isTipBulb
            ? 0.85 + 0.15 * Math.sin((now / 1000) * bulb.tipSpeed! + bulb.phase)
            : 0.75 + 0.25 * Math.sin((now / 1000) * bulb.speed + bulb.phase);

          ctx.globalAlpha = opacity;
          ctx.shadowColor = bulb.color === "#22d3ee" ? "#22d3ee" : "#a855f7";
          ctx.shadowBlur = bulb.isTipBulb ? 25 : 15;

          // SPECIAL RENDERING FOR TIP BULBS
          if (bulb.isTipBulb) {
            // Draw socket line above bulb
            ctx.globalAlpha = opacity * 0.5;
            ctx.strokeStyle = "rgba(139,92,246,0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bulb.x, bulb.y - 8);
            ctx.lineTo(bulb.x, bulb.y - 2);
            ctx.stroke();

            // Draw outer glow halo
            ctx.globalAlpha = opacity * 0.3;
            ctx.fillStyle = "rgba(192,132,252,0.3)";
            ctx.beginPath();
            ctx.arc(bulb.x, bulb.y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Draw bright inner core
            ctx.globalAlpha = opacity;
            ctx.fillStyle = bulb.color;
            ctx.beginPath();
            ctx.arc(bulb.x, bulb.y, 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Standard bulb rendering
            ctx.fillStyle = bulb.color;
            ctx.beginPath();
            ctx.arc(bulb.x, bulb.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        canvasAnimationId = window.requestAnimationFrame(draw);
      };

      canvasAnimationId = window.requestAnimationFrame(draw);
    };

    const startEffects = () => {
      initLogoChaser();
      initHangingLights();
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(startEffects, 150);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startEffects, { once: true });
    } else {
      startEffects();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("DOMContentLoaded", startEffects);
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(resizeTimeout);
      window.cancelAnimationFrame(chaserAnimationId);
      window.cancelAnimationFrame(canvasAnimationId);
      logoWrapper.querySelectorAll(".logo-chaser-dot").forEach((dot) => dot.remove());
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#0A0A0A]">
      <style>{`
        @keyframes logoPulse {
          0%, 100% {
            box-shadow: 0 0 40px 10px rgba(139,92,246,0.4), 0 0 80px 20px rgba(139,92,246,0.2);
          }
          50% {
            box-shadow: 0 0 60px 20px rgba(139,92,246,0.7), 0 0 120px 40px rgba(139,92,246,0.35);
          }
        }
        .logo-led-container {
          position: relative;
          display: inline-block;
          padding: 3px;
          overflow: visible;
        }
        .logo-led-container::before {
          content: "";
          position: absolute;
          inset: 3px;
          z-index: -1;
          border-radius: 0.75rem;
          background: transparent;
          box-shadow: 0 0 40px 10px rgba(139,92,246,0.5), 0 0 80px 20px rgba(139,92,246,0.25), 0 0 120px 40px rgba(139,92,246,0.1);
          animation: logoPulse 2.5s ease-in-out infinite;
        }
        .logo-wire {
          position: absolute;
          z-index: 20;
          background: rgba(139,92,246,0.2);
          pointer-events: none;
        }
        .logo-wire-top,
        .logo-wire-bottom {
          left: 0;
          width: 100%;
          height: 2px;
        }
        .logo-wire-top {
          top: 0;
        }
        .logo-wire-bottom {
          bottom: 0;
        }
        .logo-wire-right,
        .logo-wire-left {
          top: 0;
          width: 2px;
          height: 100%;
        }
        .logo-wire-right {
          right: 0;
        }
        .logo-wire-left {
          left: 0;
        }
        .logo-chaser-dot {
          position: absolute;
          z-index: 30;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          pointer-events: none;
          will-change: left, top;
        }
        .hanging-lights-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Hanging string lights canvas background */}
      <canvas ref={canvasRef} className="hanging-lights-canvas" />

      {/* Purple + Cyan ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A855F7]/20 rounded-full blur-[120px] animate-pulse" style={{ zIndex: 1 }} />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#06B6D4]/15 rounded-full blur-[100px] animate-pulse delay-700" style={{ zIndex: 1 }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/10 rounded-full blur-[130px]" style={{ zIndex: 1 }} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" style={{ zIndex: 1 }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" style={{ zIndex: 1 }} />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Centered Logo with Serial LED Effect */}
        <div className="relative mb-16 flex justify-center overflow-visible">
          <div className="logo-led-container" ref={logoWrapperRef}>
            <span className="logo-wire logo-wire-top" />
            <span className="logo-wire logo-wire-right" />
            <span className="logo-wire logo-wire-bottom" />
            <span className="logo-wire logo-wire-left" />
            <Image src="/logo.png" alt="The Hideout" width={530} height={190} className="relative z-10 block w-96 h-auto rounded-xl md:w-[30rem]" />
          </div>
        </div>

        <p className="text-[#A855F7] text-sm md:text-base tracking-wider mb-8">
          CONSOLE LOUNGE | COUCHES | COMMUNITY
        </p>

        <p className="text-[#06B6D4] text-sm font-semibold uppercase tracking-[0.15em] mb-6">
          CHENNAI&apos;S PREMIER GAMING LOUNGE
        </p>

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          ESCAPE THE ORDINARY.<br />
          ENTER THE <span className="text-[#A855F7]">HIDEOUT</span>.
        </h2>

        <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Book a console, grab a couch, lose track of time. Real games, real setups, real vibes — no memberships, no fuss. Just press start.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white font-semibold text-lg hover:scale-105 transition-transform">
            Sign In
          </Link>
          <a
            href="https://wa.me/919876543210?text=Hi%20Hideout!%20I%20want%20to%20book%20a%20slot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-lg border-2 border-[#06B6D4] text-[#06B6D4] font-semibold text-lg hover:bg-[#06B6D4]/10 transition-all"
          >
            Chat to Book
          </a>
        </div>
      </div>
    </section>
  );
}
