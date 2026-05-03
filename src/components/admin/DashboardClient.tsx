'use client';

import Link from "next/link";
import {
  CalendarDays,
  CalendarX2,
  Hash,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

type BookingRow = {
  id: string;
  booking_code: string;
  booking_date: string;
  total_price: number;
  status: string;
  users?: { h_id: string; display_name: string | null; email: string | null } | null;
  time_slots?: { label: string } | null;
  session_types?: { name: string; price_per_hour: number } | null;
};

type DashboardStats = {
  total_confirmed: number;
  total_cancelled: number;
  total_completed: number;
  todays_bookings: number;
  total_revenue: number;
  todays_revenue: number;
};

const statusColors: Record<string, string> = {
  confirmed: "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ADE80]",
  cancelled: "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444]",
  completed: "border-[rgba(160,166,175,0.3)] bg-[rgba(160,166,175,0.1)] text-[#A1A1AA]",
};

function StatCard({ label, value, bottom, icon: Icon, valueColor }: { label: string; value: string | number; bottom: string; icon: React.ComponentType<{ className?: string }>; valueColor: string; }) {
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[13px] font-medium text-[#A1A1AA]">{label}</div>
        <Icon className="h-4.5 w-4.5 text-[#A1A1AA]" />
      </div>
      <div className={`mt-3 font-heading text-[48px] uppercase ${valueColor}`}>{value}</div>
      <div className="mt-2 text-[12px] text-[#71717A]">{bottom}</div>
    </div>
  );
}

export default function DashboardClient({
  stats,
  todaysBookings,
  recentBookings,
}: {
  stats: DashboardStats;
  todaysBookings: BookingRow[];
  recentBookings: BookingRow[];
}) {
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-8">
        <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF3A3A]">OVERVIEW</div>
        <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#FAFAFA]">DASHBOARD</h1>
        <div className="mt-2 text-[14px] text-[#A1A1AA]">{todayLabel}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Bookings" value={stats.todays_bookings} bottom="Confirmed slots for today" icon={CalendarDays} valueColor="text-[#FF3A3A]" />
        <StatCard label="Today's Revenue" value={`₹${stats.todays_revenue}`} bottom="From confirmed bookings" icon={IndianRupee} valueColor="text-[#4ADE80]" />
        <StatCard label="Total Bookings" value={stats.total_confirmed} bottom={`${stats.total_cancelled} cancelled`} icon={Hash} valueColor="text-[#FAFAFA]" />
        <StatCard label="Total Revenue" value={`₹${stats.total_revenue}`} bottom="All time confirmed" icon={TrendingUp} valueColor="text-[#4ADE80]" />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-[32px] uppercase text-[#FAFAFA]">TODAY'S BOOKINGS</h2>
        <div className="mt-4 space-y-3">
          {todaysBookings.length ? todaysBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-[#27272A] bg-[#18181B] px-5 py-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
                <div>
                  <div className="text-[15px] font-semibold text-[#FAFAFA]">{booking.time_slots?.label}</div>
                  <span className="mt-2 inline-flex rounded-full border border-[rgba(255,58,58,0.3)] bg-[rgba(255,58,58,0.1)] px-2 py-0.5 text-[12px] font-medium text-[#FF3A3A]">
                    {booking.session_types?.name}
                  </span>
                </div>
                <div className="hidden h-10 w-px bg-[#27272A] md:block" />
                <div>
                  <div className="font-mono text-[13px] text-[#FF3A3A]">{booking.users?.h_id}</div>
                  <div className="text-[14px] text-[#A1A1AA]">{booking.users?.display_name || booking.users?.email}</div>
                </div>
                <div className="hidden h-10 w-px bg-[#27272A] md:block" />
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <div className="text-[15px] font-semibold text-[#FAFAFA]">₹{booking.total_price}</div>
                  <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${statusColors[booking.status] || statusColors.completed}`}>{booking.status}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-5 py-10 text-center">
              <CalendarX2 className="mx-auto h-10 w-10 text-[#A1A1AA]" />
              <div className="mt-3 text-[15px] text-[#A1A1AA]">No bookings today yet.</div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-[32px] uppercase text-[#FAFAFA]">RECENT BOOKINGS</h2>
          <div className="text-[14px] text-[#A1A1AA]">Last 5 bookings</div>
        </div>
        <div className="mt-4 space-y-3">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-[#27272A] bg-[#18181B] px-5 py-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
                <div>
                  <div className="text-[15px] font-semibold text-[#FAFAFA]">{booking.time_slots?.label ?? booking.booking_date}</div>
                  <span className="mt-2 inline-flex rounded-full border border-[rgba(255,58,58,0.3)] bg-[rgba(255,58,58,0.1)] px-2 py-0.5 text-[12px] font-medium text-[#FF3A3A]">
                    {booking.session_types?.name}
                  </span>
                </div>
                <div className="hidden h-10 w-px bg-[#27272A] md:block" />
                <div>
                  <div className="font-mono text-[13px] text-[#FF3A3A]">{booking.users?.h_id}</div>
                  <div className="text-[14px] text-[#A1A1AA]">{booking.users?.display_name || booking.users?.email}</div>
                </div>
                <div className="hidden h-10 w-px bg-[#27272A] md:block" />
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <div className="text-[15px] font-semibold text-[#FAFAFA]">₹{booking.total_price}</div>
                  <Link href={`/admin/bookings?id=${booking.id}`} className="rounded-md border border-[#27272A] px-3 py-1 text-[13px] text-[#A1A1AA] transition-colors hover:border-[#FF3A3A] hover:text-[#FAFAFA]">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
