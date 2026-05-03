"use client";

import { ReactNode } from "react";

type AnimatedBorderProps = {
  children: ReactNode;
  className?: string;
};

export default function AnimatedBorder({ children, className = "" }: AnimatedBorderProps) {
  return (
    <div className={`group relative ${className}`}>
      <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-[linear-gradient(120deg,#A855F7,#EC4899,#3B82F6,#A855F7)] bg-[length:200%_200%] opacity-0 blur-lg transition duration-500 group-hover:opacity-90 group-hover:animate-[borderFlow_2.5s_linear_infinite]" />
      <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-[linear-gradient(120deg,#A855F7,#EC4899,#3B82F6,#A855F7)] bg-[length:200%_200%] opacity-0 transition duration-500 group-hover:opacity-80 group-hover:animate-[borderFlow_2.5s_linear_infinite]" />
      <div className="relative rounded-2xl bg-[#18181B]">{children}</div>
    </div>
  );
}
