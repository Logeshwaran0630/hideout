'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CalendarX2,
  Check,
  Clock,
  CircleDollarSign,
  Copy,
  Gamepad2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  h_id: string;
  display_name?: string | null;
  created_at: string;
  role: string;
}

interface Booking {
  id: string;
  booking_code: string;
  booking_date: string;
  status: string;
  total_price: number;
  time_slots: { label: string }[] | null;
  session_types: { name: string }[] | null;
}

export default function ProfileClient({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A1A1AA] text-sm mb-4">Setting up your profile...</p>
          <a href="/profile" className="text-[#A855F7] text-sm underline underline-offset-4">
            Refresh
          </a>
        </div>
      </div>
    );
  }

  const profileData = { ...profile, role: profile.role || "user" };

  useEffect(() => {
    let active = true;

    async function fetchData() {
      const { data: ledger } = await supabase
        .from('h_coin_ledger')
        .select('amount')
        .eq('user_id', profileData.id);

      const balance = ledger?.reduce((sum: number, row: any) => sum + row.amount, 0) || 0;

      if (!active) {
        return;
      }

      setCoinBalance(balance);

      const today = new Date().toISOString().split('T')[0];
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          booking_date,
          status,
          total_price,
          time_slots ( label ),
          session_types ( name )
        `)
        .eq('user_id', profileData.id)
        .eq('status', 'confirmed')
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .limit(3);

      if (!active) {
        return;
      }

      setUpcomingBookings((bookings || []) as Booking[]);
      setLoadingBookings(false);
    }

    void fetchData();

    return () => {
      active = false;
    };
  }, [profileData.id, supabase]);

  function copyHId() {
    void navigator.clipboard.writeText(profileData.h_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const coinProgress = Math.min((coinBalance / 100) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="px-6 md:px-12 pt-12 pb-8">
        <p className="text-[#A855F7] text-xs font-medium uppercase tracking-[0.15em] mb-2">
          YOUR ACCOUNT
        </p>
        <h1 className="font-heading text-5xl text-[#FFFFFF] uppercase">MY HIDEOUT</h1>
      </div>

      <div className="px-6 md:px-12 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#A855F7] flex items-center justify-center text-[#FFFFFF] font-semibold text-xl shrink-0">
              {(profileData.display_name || profileData.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[#FFFFFF] font-semibold text-base">
                {profileData.display_name || 'Hideout Player'}
              </p>
              <p className="text-[#A1A1AA] text-sm">{profileData.email}</p>
            </div>
          </div>

          <div className="border-t border-[#27272A] pt-6 mb-6">
            <p className="text-[#A1A1AA] text-xs uppercase tracking-[0.15em] mb-3">
              YOUR H-ID
            </p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl text-[#A855F7] text-glow-purple tracking-wider">
                {profileData.h_id}
              </span>
              <button
                onClick={copyHId}
                className="text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors"
                title="Copy H-ID"
              >
                {copied ? (
                  <Check size={16} className="text-[#4ADE80]" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            <p className="text-[#6B6B6B] text-xs mt-2">
              Use this ID when booking via WhatsApp.
            </p>
          </div>

          <p className="text-[#A1A1AA] text-sm mb-3">
            Member since <span className="text-[#FFFFFF]">{memberSince}</span>
          </p>
          
          <p className="text-[#A1A1AA] text-sm mb-8">
            Role: <span className={`font-semibold ${profileData.role === 'admin' ? 'text-[#A855F7]' : 'text-[#22C55E]'}`}>
              {profileData.role === 'admin' ? 'ADMIN' : 'USER'}
            </span>
          </p>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 border border-[#27272A] text-[#A1A1AA] hover:border-[#A855F7] hover:text-[#FFFFFF] transition-all py-2.5 rounded-lg text-sm font-medium"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CircleDollarSign size={20} className="text-[#3B82F6]" />
              <span className="text-[#FFFFFF] font-semibold text-base">H Coins</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="font-heading text-5xl text-[#3B82F6]">{coinBalance}</span>
              <span className="text-[#A1A1AA] text-lg mb-1">coins</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between mb-1.5">
                <span className="text-[#A1A1AA] text-xs">
                  {coinBalance} / 100 coins to free session
                </span>
                <span className="text-[#3B82F6] text-xs font-medium">
                  {Math.round(coinProgress)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#27272A] rounded-full">
                <div
                  className="h-full bg-[#A855F7] rounded-full transition-all duration-500"
                  style={{ width: `${coinProgress}%` }}
                />
              </div>
            </div>
            <p className="text-[#6B6B6B] text-xs mt-3">
              Earn H Coins every time you book a session.
            </p>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 flex-1">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[#FAFAFA] font-semibold text-base">
                Upcoming Bookings
              </span>
              {upcomingBookings.length > 0 && (
                <Link
                  href="/slots"
                  className="text-[#A855F7] text-xs font-medium hover:underline underline-offset-4"
                >
                  + Book more
                </Link>
              )}
            </div>

            {loadingBookings && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-[#09090B] border border-[#27272A] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}

            {!loadingBookings && upcomingBookings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarX2 size={36} className="text-[#A1A1AA] mb-3" />
                <p className="text-[#A1A1AA] text-sm mb-1">No upcoming bookings yet.</p>
                <p className="text-[#6B6B6B] text-xs mb-5">
                  Pick a date, choose a slot, and lock it in.
                </p>
                <Link
                  href="/slots"
                  className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-[#FFFFFF]"
                >
                  <Gamepad2 size={15} />
                  Book a Slot
                </Link>
              </div>
            )}

            {!loadingBookings && upcomingBookings.length > 0 && (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#FFFFFF] text-sm font-semibold">
                        {new Date(booking.booking_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.3)] text-[#A855F7] text-xs font-medium px-2 py-0.5 rounded">
                        {booking.session_types?.[0]?.name || 'Session'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#A1A1AA] text-xs">
                        <Clock size={11} />
                        {booking.time_slots?.[0]?.label || '—'}
                      </div>
                      <span className="font-mono text-xs text-[#6B6B6B]">
                        {booking.booking_code}
                      </span>
                    </div>
                  </div>
                ))}

                <Link
                  href="/slots"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#27272A] py-2.5 text-sm font-medium text-[#A1A1AA] transition-all hover:border-[#A855F7] hover:text-[#FFFFFF]"
                >
                  <Gamepad2 size={14} />
                  Book Another Slot
                </Link>
              </div>
            )}
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
            <span className="text-[#FFFFFF] font-semibold text-base block mb-4">
              Quick Actions
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/slots"
                className="group flex flex-col items-center gap-2 rounded-lg border border-[#27272A] bg-[#0A0A0A] p-4 text-center transition-all hover:border-[#A855F7]"
              >
                <Gamepad2 size={20} className="text-[#A855F7]" />
                <span className="text-[#FFFFFF] text-xs font-medium">Book a Slot</span>
              </Link>
              <div className="flex cursor-not-allowed flex-col items-center gap-2 rounded-lg border border-[#27272A] bg-[#0A0A0A] p-4 text-center opacity-50">
                <Sparkles size={20} className="text-[#A1A1AA]" />
                <span className="text-[#A1A1AA] text-xs font-medium">Redeem Coins</span>
                <span className="text-[#6B6B6B] text-[10px]">Coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
