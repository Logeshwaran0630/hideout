"use client";

import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface LoadingButtonProps {
  onClick?: () => void;
  isLoading: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}

export default function LoadingButton({
  onClick,
  isLoading,
  children,
  className = "",
  disabled = false,
  type = "button",
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative ${className} ${isLoading ? "cursor-not-allowed opacity-70" : ""}`}
    >
      {isLoading && (
        <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
      )}
      <span className={isLoading ? "invisible" : ""}>{children}</span>
    </button>
  );
}
