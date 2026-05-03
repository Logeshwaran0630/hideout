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
    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("users")
          .select("h_id")
          .eq("id", currentUser.id)
          .single();

        setHId(profile?.h_id || null);

        const { data: ledger } = await supabase
          .from("h_coin_ledger")
          .select("amount")
          .eq("user_id", currentUser.id);

        const balance = ledger?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
        setHCoins(balance);
      }

      setAuthLoading(false);
    };

    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void getUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="The Hideout home">
          <Image
            src="/logo.png"
            alt="The Hideout"
            width={100}
            height={28}
            style={{ width: "auto", height: "28px" }}
            priority
          />
          <span className="hidden bg-gradient-to-r from-[#A855F7] to-[#3B82F6] bg-clip-text text-lg font-bold text-transparent sm:inline">
            THE HIDEOUT
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-[#FFFFFF] md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors duration-200 hover:text-[#A855F7]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {authLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-[#18181B]" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[#A855F7]/20 bg-[#A855F7]/10 px-3 py-1.5 md:flex">
                <Coins className="h-4 w-4 text-[#3B82F6]" />
                <span className="font-mono text-sm text-[#3B82F6]">{hCoins}</span>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-[#A855F7]/20 bg-[#A855F7]/10 px-3 py-1.5 md:flex">
                <span className="font-mono text-xs text-[#A855F7]">{hId}</span>
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
            className="inline-flex items-center justify-center rounded-lg p-2 text-[#FFFFFF] transition-colors hover:text-[#A855F7] md:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 md:hidden ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-[#2A2A2A] bg-[#0A0A0A] px-6 py-4">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2 text-[#FFFFFF] hover:text-[#A855F7]"
              >
                {link.label}
              </a>
            ))}

            {user && (
              <Link href="/profile" onClick={() => setOpen(false)} className="py-2 text-[#FFFFFF] hover:text-[#A855F7]">
                My Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


