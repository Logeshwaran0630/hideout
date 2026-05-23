"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Coins } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const links = [
  { href: "#about", label: "About" },
  { href: "#games", label: "Games" },
  { href: "#pricing", label: "Pricing" },
  { href: "/slots", label: "Book Now" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hId, setHId] = useState<string | null>(null);
  const [hCoins, setHCoins] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async (userId: string) => {
      const { data: profile } = await supabase.from("users").select("h_id").eq("id", userId).single();

      setHId(profile?.h_id || null);

      const { data: ledger } = await supabase.from("h_coin_ledger").select("amount").eq("user_id", userId);

      const balance = ledger?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
      setHCoins(balance);
    };

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        void loadProfileData(currentUser.id);
      } else {
        setHId(null);
        setHCoins(0);
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthLoading(false);

      if (nextUser) {
        void loadProfileData(nextUser.id);
      } else {
        setHId(null);
        setHCoins(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1A1F28] bg-[rgba(5,5,8,0.95)] backdrop-blur-[12px]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo - Fixed Size */}
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="The Hideout home">
          <div className="relative h-8 w-8">
            <Image
              src="/logo.png"
              alt="The Hideout"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="hidden text-lg font-orbitron font-black bg-gradient-to-r from-white to-[#ff5200] bg-clip-text text-transparent sm:inline" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>
            THE HIDEOUT
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-sans font-semibold uppercase tracking-[0.12em] text-[#A0A6AF] md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors duration-300 hover:text-[#ff5200]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {authLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-[rgba(255,255,255,0.05)]" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md border border-[rgba(0,212,160,0.22)] bg-[rgba(0,212,160,0.08)] px-3 py-1.5 md:flex">
                <Coins className="h-4 w-4 text-[#ff5200]" />
                <span className="font-mono text-sm font-bold text-[#ff5200]" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{hCoins}</span>
              </div>
              <div className="hidden items-center gap-2 rounded-md border border-[rgba(255,82,0,0.3)] bg-[rgba(255,82,0,0.05)] px-3 py-1.5 md:flex">
                <span className="hid-text text-xs">{hId}</span>
              </div>
              <Link
                href="/profile"
                className="btn-primary rounded-lg px-4 py-1.5 text-sm font-semibold text-[#FFFFFF]"
              >
                Profile
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary rounded-lg px-5 py-2 text-sm font-semibold text-[#FFFFFF]"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            className="inline-flex items-center justify-center rounded-lg p-2 text-[#FFFFFF] transition-colors hover:text-[#ff5200] md:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 md:hidden ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-[rgba(255,82,0,0.16)] bg-[#050508] px-6 py-4">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2 text-[#FFFFFF] hover:text-[#ff5200]"
              >
                {link.label}
              </a>
            ))}

            {user && (
              <Link href="/profile" onClick={() => setOpen(false)} className="py-2 text-[#FFFFFF] hover:text-[#ff5200]">
                My Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}