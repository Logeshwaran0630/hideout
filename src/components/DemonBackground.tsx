"use client";

export default function DemonBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-dark-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,82,0,0.14),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(0,212,160,0.09),transparent_40%),radial-gradient(circle_at_20%_30%,rgba(255,82,0,0.08),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(255,82,0,0.08),transparent_25%)]" />
      <div className="absolute left-1/2 top-[8%] w-[86vw] max-w-5xl -translate-x-1/2 opacity-[0.08]">
        <svg viewBox="0 0 900 560" className="h-full w-full">
          <defs>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M450 80 C580 80 685 175 685 295 C685 420 585 500 450 500 C315 500 215 420 215 295 C215 175 320 80 450 80Z"
            fill="none"
            stroke="#ff5200"
            strokeWidth="4"
            filter="url(#softGlow)"
          />
          <path d="M280 140 Q220 55 195 35 Q240 45 315 125" fill="none" stroke="#ff5200" strokeWidth="4" />
          <path d="M620 140 Q680 55 705 35 Q660 45 585 125" fill="none" stroke="#ff5200" strokeWidth="4" />
          <ellipse cx="365" cy="265" rx="52" ry="42" fill="none" stroke="#ff5200" strokeWidth="3" />
          <ellipse cx="535" cy="265" rx="52" ry="42" fill="none" stroke="#ff5200" strokeWidth="3" />
          <path d="M442 292 L450 325 L458 292" fill="none" stroke="#ff5200" strokeWidth="3" />
          <path d="M385 365 L412 365 M420 365 L447 365 M455 365 L482 365 M490 365 L517 365" stroke="#ff5200" strokeWidth="3" />
          <path d="M338 410 Q450 455 562 410" fill="none" stroke="#cc2200" strokeWidth="4" opacity="0.7" />
          <path d="M310 180 Q450 120 590 180" fill="none" stroke="#00d4a0" strokeWidth="2" opacity="0.35" />
        </svg>
      </div>

      <div className="absolute left-1/2 top-[20%] h-40 w-40 -translate-x-1/2 rounded-full bg-devil-orange blur-[140px] opacity-20" />
      <div className="absolute left-[18%] top-[56%] h-36 w-36 rounded-full bg-ghost-teal blur-[150px] opacity-14" />
      <div className="absolute right-[16%] top-[50%] h-36 w-36 rounded-full bg-devil-orange blur-[150px] opacity-14" />

      <div className="absolute bottom-0 left-0 right-0 h-52 bg-[radial-gradient(ellipse_at_center,rgba(255,82,0,0.08),transparent_68%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.35))]" />
    </div>
  );
}
