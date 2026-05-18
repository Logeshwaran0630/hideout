'use client';

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, CalendarX2, Clock3, FileText, IndianRupee, Landmark, Scan, Wallet } from "lucide-react";
import DailyReportModal from "./DailyReportModal";

type BookingRow = {
  id: string;
  booking_code: string;
  booking_date: string;
  total_price: number;
  status: string;
  payment_status?: string | null;
  payment_mode?: string | null;
  paid_at?: string | null;
  collected_by?: string | null;
  users?: { h_id: string; display_name: string | null; email: string | null } | null;
  time_slots?: { label: string } | null;
  session_types?: { name: string } | null;
  setups?: { display_name: string } | null;
};

type DashboardStats = {
  todayRevenue: number;
  pendingAmount: number;
  completedCount: number;
  cashTotal: number;
  upiTotal: number;
};

const paymentStatusColors: Record<string, string> = {
  paid: "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ADE80]",
  pending: "border-[rgba(250,204,21,0.3)] bg-[rgba(250,204,21,0.1)] text-[#FACC15]",
};

const paymentModeColors: Record<string, string> = {
  cash: "border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]",
  upi: "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ADE80]",
};

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

function StatCard({ label, value, bottom, icon: Icon, valueColor }: { label: string; value: string | number; bottom: string; icon: React.ComponentType<{ className?: string }>; valueColor: string; }) {
  return (
    <div className="rounded-xl border border-[#2A2F38] bg-[#14181F] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[13px] font-medium text-[#A0A6AF]">{label}</div>
        <Icon className="h-4.5 w-4.5 text-[#A0A6AF]" />
      </div>
      <div className={`mt-3 font-heading text-[48px] uppercase ${valueColor}`}>{value}</div>
      <div className="mt-2 text-[12px] text-[#71717A]">{bottom}</div>
    </div>
  );
}

function PaymentBadge({ status }: { status?: string | null }) {
  const normalizedStatus = status ?? "pending";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-medium ${paymentStatusColors[normalizedStatus] ?? paymentStatusColors.pending}`}>
      {normalizedStatus}
    </span>
  );
}

function PaymentModeBadge({ mode }: { mode?: string | null }) {
  if (!mode) {
    return <span className="text-[12px] text-[#71717A]">-</span>;
  }

  const normalizedMode = mode.toLowerCase();
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-medium uppercase ${paymentModeColors[normalizedMode] ?? paymentModeColors.cash}`}>
      {normalizedMode}
    </span>
  );
}

export default function DashboardClient({
  stats,
  cashTotal,
  upiTotal,
  todaysBookings,
  recentBookings,
}: {
  stats: DashboardStats;
  cashTotal: number;
  upiTotal: number;
  todaysBookings: BookingRow[];
  recentBookings: BookingRow[];
}) {
  const [showReportModal, setShowReportModal] = useState(false);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF4500]">OVERVIEW</div>
          <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#F5F1EA]">DASHBOARD</h1>
          <div className="mt-2 text-[14px] text-[#A0A6AF]">{todayLabel}</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/scan"
            className="flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#16A34A]"
          >
            <Scan className="h-4 w-4" />
            Scan QR
          </Link>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#FF4500] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#FF4500]"
          >
            <FileText className="h-4 w-4" />
            Daily Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Today's Revenue" value={formatMoney(stats.todayRevenue)} bottom="Paid bookings collected today" icon={IndianRupee} valueColor="text-[#4ADE80]" />
        <StatCard label="Pending Payments" value={formatMoney(stats.pendingAmount)} bottom="Confirmed bookings still unpaid" icon={Clock3} valueColor="text-[#FACC15]" />
        <StatCard label="Completed Bookings" value={stats.completedCount} bottom="Bookings already marked paid" icon={CalendarDays} valueColor="text-[#FF4500]" />
        <StatCard label="Cash Collected" value={formatMoney(stats.cashTotal)} bottom="All paid bookings with cash" icon={Wallet} valueColor="text-[#60A5FA]" />
        <StatCard label="UPI Collected" value={formatMoney(stats.upiTotal)} bottom="All paid bookings with UPI" icon={Landmark} valueColor="text-[#4ADE80]" />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-[32px] uppercase text-[#F5F1EA]">TODAY&apos;S BOOKINGS</h2>
        <div className="mt-4 space-y-3">
          {todaysBookings.length ? todaysBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-[#2A2F38] bg-[#14181F] px-5 py-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
                <div>
                  <div className="text-[15px] font-semibold text-[#F5F1EA]">{booking.time_slots?.label}</div>
                  <span className="mt-2 inline-flex rounded-full border border-[rgba(255,69,0,0.3)] bg-[rgba(255,69,0,0.1)] px-2 py-0.5 text-[12px] font-medium text-[#FF4500]">
                    {booking.session_types?.name}
                  </span>
                </div>
                <div className="hidden h-10 w-px bg-[#2A2F38] md:block" />
                <div>
                  <div className="font-mono text-[13px] text-[#FF4500]">{booking.users?.h_id}</div>
                  <div className="text-[14px] text-[#A0A6AF]">{booking.users?.display_name || booking.users?.email}</div>
                </div>
                <div className="hidden h-10 w-px bg-[#2A2F38] md:block" />
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <div className="text-[15px] font-semibold text-[#F5F1EA]">Rs. {booking.total_price}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentBadge status={booking.payment_status} />
                    <PaymentModeBadge mode={booking.payment_mode} />
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-xl border border-[#2A2F38] bg-[#14181F] px-5 py-10 text-center">
              <CalendarX2 className="mx-auto h-10 w-10 text-[#A0A6AF]" />
              <div className="mt-3 text-[15px] text-[#A0A6AF]">No bookings today yet.</div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-[32px] uppercase text-[#F5F1EA]">RECENT BOOKINGS</h2>
          <div className="text-[14px] text-[#A0A6AF]">Last 5 bookings</div>
        </div>
        <div className="mt-4 space-y-3">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-[#2A2F38] bg-[#14181F] px-5 py-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
                <div>
                  <div className="text-[15px] font-semibold text-[#F5F1EA]">{booking.time_slots?.label ?? booking.booking_date}</div>
                  <span className="mt-2 inline-flex rounded-full border border-[rgba(255,69,0,0.3)] bg-[rgba(255,69,0,0.1)] px-2 py-0.5 text-[12px] font-medium text-[#FF4500]">
                    {booking.session_types?.name}
                  </span>
                </div>
                <div className="hidden h-10 w-px bg-[#2A2F38] md:block" />
                <div>
                  <div className="font-mono text-[13px] text-[#FF4500]">{booking.users?.h_id}</div>
                  <div className="text-[14px] text-[#A0A6AF]">{booking.users?.display_name || booking.users?.email}</div>
                </div>
                <div className="hidden h-10 w-px bg-[#2A2F38] md:block" />
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <div className="text-[15px] font-semibold text-[#F5F1EA]">Rs. {booking.total_price}</div>
                  <Link href={`/admin/bookings?id=${booking.id}`} className="rounded-md border border-[#2A2F38] px-3 py-1 text-[13px] text-[#A0A6AF] transition-colors hover:border-[#FF4500] hover:text-[#F5F1EA]">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <DailyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        bookings={todaysBookings}
        date={new Date()}
        cashTotal={cashTotal}
        upiTotal={upiTotal}
      />
    </div>
  );
}
