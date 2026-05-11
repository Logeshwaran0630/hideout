'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
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
  { href: "/admin/settings", label: "Settings", icon: Settings },
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
    <div className="flex h-full flex-col bg-[#18181B]">
      <div className="px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="The Hideout"
            width={120}
            height={24}
            style={{ width: "auto", height: "24px" }}
          />
        </Link>
        <div className="mt-2 text-[13px] font-semibold text-[#A1A1AA]">Admin Panel</div>
      </div>

      <div className="border-t border-[#27272A]" />

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-[#8B5CF6] text-[#FAFAFA]"
                  : "text-[#A1A1AA] hover:bg-[#09090B] hover:text-[#FAFAFA]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#FAFAFA]" : "text-[#A1A1AA]"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#27272A] p-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#A855F7]" />
          <div className="text-[13px] font-medium text-[#FAFAFA]">{profile.display_name || profile.email}</div>
        </div>
        <div className="mt-1 font-mono text-[11px] text-[#A1A1AA]">{profile.h_id}</div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 flex items-center gap-2 text-[13px] text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
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
        className="fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B] p-2 text-[#FAFAFA] md:hidden"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#27272A] bg-[#18181B] md:flex md:flex-col">
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
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-[#27272A] bg-[#18181B] shadow-2xl">
            <div className="flex items-center justify-end p-4">
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-[#A1A1AA]">
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
