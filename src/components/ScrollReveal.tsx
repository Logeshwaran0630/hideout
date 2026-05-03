"use client";

import { motion, useAnimation, useInView } from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";

type RevealType = "fade" | "scale" | "flip";
type Direction = "up" | "down" | "left" | "right";

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
  type?: RevealType;
  direction?: Direction;
  className?: string;
};

export default function ScrollReveal({
  children,
  delay = 0,
  type = "fade",
  direction = "up",
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const axis = {
    up: { x: 0, y: 50 },
    down: { x: 0, y: -50 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 },
  };

  const variants = {
    fade: {
      hidden: { opacity: 0, ...axis[direction] },
      visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.75, delay: delay / 1000 } },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.88 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.65, delay: delay / 1000, type: "spring" as const } },
    },
    flip: {
      hidden: { opacity: 0, rotateX: 85 },
      visible: { opacity: 1, rotateX: 0, transition: { duration: 0.7, delay: delay / 1000 } },
    },
  };

  return (
    <motion.div ref={ref} initial="hidden" animate={controls} variants={variants[type]} className={className}>
      {children}
    </motion.div>
  );
}
