"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarX2,
  Check,
  CircleDollarSign,
  Clock,
  Copy,
  Gamepad2,
  Gift,
  History,
  LogOut,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import BookingTicket from "./BookingTicket";

interface Profile {
  id: string;
  email: string;
  h_id: string;
  display_name?: string | null;
  created_at: string;
  role: string;
}

type TimeSlot = { label: string; start_time?: string; end_time?: string };
type SessionType = { name: string; max_players?: number; h_coins_earned?: number };
type Setup = { display_name: string; badge?: string };

interface Booking {
  id: string;
  booking_code: string;
  booking_date: string;
  status: string;
  total_price: number;
  payment_status: string;
  payment_mode?: string | null;
  time_slots?: TimeSlot | TimeSlot[] | null;
  session_types?: SessionType | SessionType[] | null;
  setups?: Setup | Setup[] | null;
}

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProfileClient({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking; isPast?: boolean } | null>(null);

  const profileData = useMemo(() => (profile ? { ...profile, role: profile.role || "user" } : null), [profile]);
  const isAdmin = profileData?.role === "admin";

  useEffect(() => {
    if (!profileData) {
      return;
    }

    let active = true;

    async function fetchData() {
      setLoading(true);

      const { data: ledger } = await supabase
        .from("h_coin_ledger")
        .select("amount")
        .eq("user_id", profileData.id);

      const balance = ledger?.reduce((sum: number, row: { amount: number | null }) => sum + (row.amount ?? 0), 0) || 0;

      const today = new Date().toISOString().split("T")[0];

      const { data: upcoming } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_code,
          booking_date,
          status,
          total_price,
          payment_status,
          payment_mode,
          time_slots ( label, start_time, end_time ),
          session_types ( name, max_players, h_coins_earned ),
          setups ( display_name, badge )
        `)
        .eq("user_id", profileData.id)
        .eq("status", "confirmed")
        .gte("booking_date", today)
        .order("booking_date", { ascending: true })
        .limit(6);

      const { data: past } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_code,
          booking_date,
          status,
          total_price,
          payment_status,
          payment_mode,
          time_slots ( label, start_time, end_time ),
          session_types ( name, max_players, h_coins_earned ),
          setups ( display_name, badge )
        `)
        .eq("user_id", profileData.id)
        .eq("payment_status", "paid")
        .lt("booking_date", today)
        .order("booking_date", { ascending: false })
        .limit(10);

      if (!active) {
        return;
      }

      setCoinBalance(balance);
      setUpcomingBookings((upcoming || []) as Booking[]);
      setPastBookings((past || []) as Booking[]);
      setLoading(false);
    }

    void fetchData();

    return () => {
      active = false;
    };
  }, [profileData]);

  if (!profileData || !profile) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-sm text-white/60">Setting up your profile...</p>
          <a href="/profile" className="text-devil-orange underline underline-offset-4">
            Refresh
          </a>
        </div>
      </div>
    );
  }

  function copyHId() {
    void navigator.clipboard.writeText(profileData.h_id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const coinProgress = Math.min((coinBalance / 100) * 100, 100);
  const coinsNeeded = Math.max(100 - coinBalance, 0);

  return (
    <div className="font-body min-h-screen bg-dark-bg text-white">
      <div className="border-b border-[rgba(255,82,0,0.16)] bg-[#0A0F18]/50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-devil-orange">Your Account</p>
          <h1 className="font-title text-4xl uppercase md:text-5xl">My Hideout</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-card-bg p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-devil-orange to-devil-red text-2xl font-bold text-white">
                {(profileData.display_name || profileData.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{profileData.display_name || "Hideout Player"}</p>
                <p className="text-sm text-white/60">{profileData.email}</p>
              </div>
            </div>

            <div className="mb-5 border-t border-[rgba(255,82,0,0.16)] pt-4">
              <p className="mb-2 text-xs uppercase tracking-[0.15em] text-white/50">Your H-ID</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl tracking-wider text-devil-orange glow-orange">{profileData.h_id}</span>
                <button onClick={copyHId} className="text-white/60 transition-colors hover:text-ghost-teal" title="Copy H-ID">
                  {copied ? <Check size={16} className="text-[#4ADE80]" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">Use this ID when booking via WhatsApp.</p>
            </div>

            <div className="space-y-2 text-sm text-white/60">
              <p>
                Member since <span className="text-white">{memberSince}</span>
              </p>
              <p>
                Role:{" "}
                <span className={`font-semibold ${isAdmin ? "text-devil-orange" : "text-ghost-teal"}`}>
                  {isAdmin ? "ADMIN" : "USER"}
                </span>
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(255,82,0,0.28)] py-2.5 text-sm font-medium text-white/70 transition-all hover:border-devil-orange hover:text-white"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>

          <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-card-bg p-6">
            <div className="mb-4 flex items-center gap-2">
              <CircleDollarSign size={20} className="text-devil-orange" />
              <span className="text-base font-semibold text-white">H Coins</span>
            </div>
            <div className="mb-4 flex items-end gap-2">
              <span className="font-title text-5xl text-devil-orange glow-orange">{coinBalance}</span>
              <span className="mb-1 text-lg text-white/60">coins</span>
            </div>
            <div className="mb-2">
              <div className="mb-1.5 flex justify-between text-xs text-white/55">
                <span>{coinsNeeded > 0 ? `${coinsNeeded} more coins to free session` : "Ready for free session!"}</span>
                <span className="text-ghost-teal">{Math.round(coinProgress)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#2A2F38]">
                <div className="h-full rounded-full bg-linear-to-r from-devil-orange to-devil-red transition-all duration-500" style={{ width: `${coinProgress}%` }} />
              </div>
            </div>
            <p className="mt-3 text-xs text-white/40">Earn H Coins every time you book a session.</p>
            <Link href="/slots" className="btn-primary mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white">
              <Gamepad2 size={15} />
              Book More
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-card-bg p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-devil-orange" />
                <span className="text-base font-semibold text-white">Upcoming Bookings</span>
              </div>
              {upcomingBookings.length > 0 && (
                <Link href="/slots" className="text-xs font-medium text-devil-orange underline-offset-4 hover:underline">
                  + Book more
                </Link>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-[#0A0F18]" />
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarX2 size={36} className="mb-3 text-white/40" />
                <p className="mb-1 text-sm text-white/60">No upcoming bookings yet.</p>
                <p className="mb-5 text-xs text-white/40">Pick a date, choose a slot, and lock it in.</p>
                <Link href="/slots" className="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white">
                  <Gamepad2 size={15} />
                  Book a Slot
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const timeSlot = firstItem(booking.time_slots);
                  const sessionType = firstItem(booking.session_types);
                  const setup = firstItem(booking.setups);

                  return (
                    <div key={booking.id} className="rounded-xl border border-[#2A2F38] bg-[#0A0F18] p-4">
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-white">{formatDate(booking.booking_date)}</span>
                        <span className="rounded-full border border-[rgba(255,82,0,0.24)] bg-[rgba(255,82,0,0.1)] px-2.5 py-0.5 text-xs font-medium text-devil-orange">
                          {sessionType?.name || "Session"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-white/55">
                            <Clock size={11} />
                            {timeSlot?.label || "Time TBD"}
                          </div>
                          <div className="text-sm text-white/85">
                            {setup?.display_name || "Setup"} · {sessionType?.name || "Session"}
                          </div>
                          <div className="font-mono text-xs text-white/40">{booking.booking_code}</div>
                          <div className="text-sm font-semibold text-devil-orange">₹{booking.total_price}</div>
                        </div>
                        <button
                          onClick={() => setSelectedBooking({ booking, isPast: false })}
                          className="rounded-lg border border-devil-orange px-3 py-1.5 text-xs text-devil-orange transition hover:bg-[rgba(255,82,0,0.1)]"
                        >
                          View Ticket
                        </button>
                      </div>
                    </div>
                  );
                })}

                <Link href="/slots" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#2A2F38] py-2.5 text-sm font-medium text-white/65 transition-all hover:border-devil-orange hover:text-white">
                  <Gamepad2 size={14} />
                  Book Another Slot
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-card-bg p-6">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-white/55" />
              <span className="text-base font-semibold text-white">Past Bookings</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-[#0A0F18]" />
                ))}
              </div>
            ) : pastBookings.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/60">No past bookings yet</div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {pastBookings.map((booking) => {
                  const timeSlot = firstItem(booking.time_slots);
                  const sessionType = firstItem(booking.session_types);
                  const setup = firstItem(booking.setups);

                  return (
                    <div key={booking.id} className="rounded-xl border border-[#2A2F38] bg-[#0A0F18] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-white/45">{booking.booking_code}</span>
                            <span className="rounded-full border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4ADE80]">
                              Completed
                            </span>
                          </div>
                          <div className="text-sm text-white/85">
                            {setup?.display_name || "Setup"} · {sessionType?.name || "Session"}
                          </div>
                          <div className="text-xs text-white/45">
                            {formatDate(booking.booking_date)} · {timeSlot?.label || "Time TBD"}
                          </div>
                          <div className="text-sm font-semibold text-devil-orange">₹{booking.total_price}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking({ booking, isPast: true })}
                          className="shrink-0 rounded-lg border border-[#2A2F38] px-3 py-1.5 text-xs text-white/65 transition hover:border-devil-orange hover:text-devil-orange"
                        >
                          View Ticket
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-card-bg p-6">
            <span className="mb-4 block text-base font-semibold text-white">Quick Actions</span>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/slots" className="group flex flex-col items-center gap-2 rounded-lg border border-[#2A2F38] bg-[#0A0F18] p-4 text-center transition-all hover:border-devil-orange">
                <Gamepad2 size={20} className="text-devil-orange" />
                <span className="text-xs font-medium text-white">Book a Slot</span>
              </Link>
              <div className="flex cursor-not-allowed flex-col items-center gap-2 rounded-lg border border-[#2A2F38] bg-[#0A0F18] p-4 text-center opacity-50">
                <Gift size={20} className="text-white/45" />
                <span className="text-xs font-medium text-white/50">Redeem Coins</span>
                <span className="text-[10px] text-white/35">Coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/95 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="absolute -top-12 right-0 z-10 rounded-full bg-red-500/80 p-2 text-white transition hover:bg-red-600"
              aria-label="Close ticket"
            >
              <X className="h-5 w-5" />
            </button>
            <BookingTicket
              booking={selectedBooking.booking}
              customerName={profileData.display_name || profileData.email}
              hId={profileData.h_id}
              isPast={selectedBooking.isPast}
              onClose={() => setSelectedBooking(null)}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}
    </div>
  );
}
