"use client";

export default function NeonBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,69,0,0.12),transparent_45%),radial-gradient(circle_at_80%_78%,rgba(255,87,34,0.12),transparent_45%),radial-gradient(circle_at_45%_18%,rgba(34,197,94,0.08),transparent_48%)] animate-[meshPulse_10s_ease-in-out_infinite]" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF4500] to-transparent animate-[scanLine_4.5s_linear_infinite]" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
}
