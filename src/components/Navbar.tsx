"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Coins } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { href: "#setups", label: "Setups" },
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#2A2A2A]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="The Hideout" width={32} height={32} className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">
              THE HIDEOUT
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-[#A1A1AA] hover:text-white transition">
                {link.label}
              </Link>
            ))}
            {!authLoading && (user ? (
              <Link href="/profile" className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white font-semibold text-sm">
                My Profile
              </Link>
            ) : (
              <Link href="/login" className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white font-semibold text-sm">
                Sign In
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2">
            {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-[#A1A1AA] hover:text-white py-2">
                {link.label}
              </Link>
            ))}
            {!authLoading && (user ? (
              <Link href="/profile" onClick={() => setIsOpen(false)} className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white font-semibold text-sm text-center">
                My Profile
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white font-semibold text-sm text-center">
                Sign In
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}