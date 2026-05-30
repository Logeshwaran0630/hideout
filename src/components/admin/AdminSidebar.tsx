'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CircleDollarSign,
  Clock,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Timer,
  Settings,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/manual-booking", label: "Manual Booking", icon: CalendarPlus },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/coins", label: "H Coins", icon: CircleDollarSign },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/time-slots", label: "Time Slots", icon: Clock },
  { href: "/admin/help", label: "Admin Instruction", icon: HelpCircle },
  { href: "/admin/settings", label: "Price Settings", icon: Settings },
  { href: "/admin/setups", label: "All-Access Pass", icon: Timer },
];

type AdminProfile = {
  display_name: string | null;
  email: string | null;
  h_id: string;
};

export default function AdminSidebar({ profile }: { profile: AdminProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const content = (
    <div className="flex h-full flex-col bg-[#0A0F18]">
      <div className="px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="The Hideout"
            width={120}
            height={24}
            style={{ width: "auto", height: "24px" }}
            loading="eager"
          />
        
        </Link>
        <div className="mt-2 text-[13px] font-semibold text-[#A0A6AF] font-sans">Admin Panel</div>
      </div>

      <div className="border-t border-[#1A1F28]" />

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-sans font-semibold transition-colors duration-150 ${
                isActive
                  ? "bg-gradient-to-r from-[rgba(255,82,0,0.15)] to-[rgba(204,34,0,0.15)] text-[#ff5200] border-l-[3px] border-[#ff5200]"
                  : "text-[#A0A6AF] hover:bg-[#050508] hover:text-[#F5F1EA]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#ff5200]" : "text-[#A0A6AF]"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1A1F28] p-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ff5200]" />
          <div className="text-[13px] font-sans font-semibold text-[#F5F1EA]">{profile.display_name || profile.email}</div>
        </div>
        <div className="mt-1 hid-text text-[11px]">{profile.h_id}</div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 flex items-center gap-2 text-[13px] font-sans text-[#A0A6AF] transition-colors hover:text-[#F5F1EA]"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-lg border border-[#1A1F28] bg-[#0A0F18] p-2 text-[#F5F1EA] md:hidden"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#1A1F28] bg-[#0A0F18] md:flex md:flex-col">
        {content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-[#1A1F28] bg-[#0A0F18] shadow-2xl">
            <div className="flex items-center justify-end p-4">
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-[#A0A6AF]">
                <X className="h-5 w-5" />
              </button>
            </div>
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
