"use client";

import Link from "next/link";
import { Gamepad2, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Gamepad2 className="mx-auto mb-6 h-20 w-20 text-[#ff5200]" />
        <h1 className="text-6xl font-black text-[#ff5200] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-[#A0A6AF] mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-outline px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
        <div className="mt-8 text-sm text-[#A0A6AF]">
          Need help?{" "}
          <a href="https://wa.me/919876543210" className="text-[#ff5200] hover:underline">
            Chat with us
          </a>
        </div>
      </div>
    </div>
  );
}
