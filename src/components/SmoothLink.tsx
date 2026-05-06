"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface SmoothLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function SmoothLink({ href, children, className = "", onClick }: SmoothLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        // Update URL without reload
        window.history.pushState(null, "", href);
      }
    }
    onClick?.();
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
