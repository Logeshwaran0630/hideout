"use client";

import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function ScrollReveal({ children, delay = 0, className = "" }: ScrollRevealProps) {
  // ScrollReveal temporarily disabled - renders children instantly
  return (
    <div className={className}>
      {children}
    </div>
  );
}
