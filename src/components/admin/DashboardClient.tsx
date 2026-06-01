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
  guest_name?: string | null;
  guest_phone?: string | null;
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

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

function StatCard({
  label,
  value,
  bottom,
  icon: Icon,
  valueColor,
  iconColor,
}: {
  label: string;
  value: string | number;
  bottom: string;
  icon: React.ComponentType<{ className?: string }>;
  valueColor: string;
  iconColor: string;
}) {
  return (
    <div className="stat-card rounded-xl border border-[#1A1F28] bg-[#0A0F18] p-6 transition-all duration-300 hover:border-[rgba(255,82,0,0.3)]">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[13px] font-sans font-semibold text-[#A0A6AF]">{label}</div>
        <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
      </div>
      <div className={`stat-card-value number-bebas-xl uppercase ${valueColor}`}>{value}</div>
      <div className="mt-2 text-[12px] font-sans text-[#6B7280]">{bottom}</div>
    </div>
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
          <div className="text-[12px] font-sans font-semibold uppercase tracking-[0.15em] text-[#ff5200]">OVERVIEW</div>
          <h1 className="mt-3 font-orbitron text-[48px] uppercase leading-none text-[#F5F1EA]" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>DASHBOARD</h1>
          <div className="mt-2 text-[14px] font-sans text-[#A0A6AF]">{todayLabel}</div>
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
            className="flex items-center gap-2 rounded-lg bg-linear-to-r from-[#ff5200] to-[#cc2200] px-4 py-2 text-sm font-medium text-white transition hover:scale-105"
          >
            <FileText className="h-4 w-4" />
            Daily Report
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Today's Revenue" value={formatMoney(stats.todayRevenue)} bottom="Paid bookings collected today" icon={IndianRupee} valueColor="stat-green" iconColor="text-green-500" />
        <StatCard label="Pending Payments" value={formatMoney(stats.pendingAmount)} bottom="Confirmed bookings still unpaid" icon={Clock3} valueColor="stat-yellow" iconColor="text-yellow-500" />
        <StatCard label="Completed Bookings" value={stats.completedCount} bottom="Bookings already marked paid" icon={CalendarDays} valueColor="stat-green" iconColor="text-green-500" />
        <StatCard label="Cash Collected" value={formatMoney(stats.cashTotal)} bottom="All paid bookings with cash" icon={Wallet} valueColor="stat-blue" iconColor="text-blue-500" />
        <StatCard label="UPI Collected" value={formatMoney(stats.upiTotal)} bottom="All paid bookings with UPI" icon={Landmark} valueColor="stat-cyan" iconColor="text-cyan-500" />
      </div>

      <section className="mt-10">
        <h2 className="font-orbitron text-[32px] uppercase text-[#F5F1EA]" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>TODAY&apos;S BOOKINGS</h2>
        <div className="table-container mt-4 overflow-x-auto rounded-2xl border border-[#1A1F28] bg-[#0A0F18]">
          <table className="w-full min-w-230 table-fixed border-collapse">
            <thead className="bg-[#050508]">
              <tr className="border-b border-[rgba(255,82,0,0.16)]">
                <th className="w-25 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Time</th>
                <th className="w-27.5 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Customer</th>
                <th className="w-30 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Setup</th>
                <th className="w-25 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Amount</th>
                <th className="w-27.5 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Payment</th>
                <th className="w-25 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Status</th>
                <th className="w-35 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todaysBookings.length ? todaysBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-[rgba(255,82,0,0.08)] transition hover:bg-[#0A0F18]/50">
                  <td className="table-cell-align px-4 py-3 text-sm text-white">{booking.time_slots?.label || '-'}</td>
                  <td className="table-cell-align px-4 py-3 text-sm font-mono text-[#ff5200]">{booking.booking_code}</td>
                  <td className="table-cell-align px-4 py-3">
                    <div className="text-sm text-white">{booking.users?.display_name || booking.guest_name || 'Guest'}</div>
                    <div className="text-xs text-[#A0A6AF]">{booking.users?.email || booking.guest_phone || '-'}</div>
                  </td>
                  <td className="table-cell-align px-4 py-3 text-sm text-white">{booking.setups?.display_name || '-'}</td>
                  <td className="table-cell-align px-4 py-3 text-sm font-semibold text-[#ff5200]">Rs. {booking.total_price}</td>
                  <td className="table-cell-align px-4 py-3">
                    {booking.payment_status === 'paid' ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${booking.payment_mode === 'cash' ? 'bg-blue-500/20 text-blue-500' : 'bg-cyan-500/20 text-cyan-500'}`}>
                        {booking.payment_mode?.toUpperCase() || 'PAID'}
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-500">Pending</span>
                    )}
                  </td>
                  <td className="table-cell-align px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                      {booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                    </span>
                  </td>
                  <td className="table-cell-align px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="action-btn rounded bg-green-500/20 px-2 py-1 text-xs text-green-500 transition hover:bg-green-500/30">Check-in</button>
                      <button type="button" className="action-btn rounded bg-red-500/20 px-2 py-1 text-xs text-red-500 transition hover:bg-red-500/30">Cancel</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#A0A6AF]">
                    <CalendarX2 className="mx-auto h-10 w-10 text-[#A0A6AF]" />
                    <div className="mt-3 text-[15px] font-sans text-[#A0A6AF]">No bookings today yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-orbitron text-[32px] uppercase text-[#F5F1EA]" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>RECENT BOOKINGS</h2>
          <div className="text-[14px] font-sans text-[#A0A6AF]">Last 5 bookings</div>
        </div>
        <div className="table-container mt-4 overflow-x-auto rounded-2xl border border-[#1A1F28] bg-[#0A0F18]">
          <table className="w-full min-w-190 table-fixed border-collapse">
            <thead className="bg-[#050508]">
              <tr className="border-b border-[rgba(255,82,0,0.16)]">
                <th className="w-30 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Date</th>
                <th className="w-27.5 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Customer</th>
                <th className="w-25 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Amount</th>
                <th className="w-25 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Status</th>
                <th className="w-27.5 px-4 py-3 text-left text-sm font-medium text-[#A0A6AF]">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-[rgba(255,82,0,0.08)] transition hover:bg-[#0A0F18]/50">
                  <td className="table-cell-align px-4 py-3 text-sm text-[#A0A6AF]">{new Date(booking.booking_date).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell-align px-4 py-3 text-sm font-mono text-[#ff5200]">{booking.booking_code}</td>
                  <td className="table-cell-align px-4 py-3">
                    <div className="text-sm text-white">{booking.users?.display_name || booking.guest_name || 'Guest'}</div>
                    <div className="text-xs text-[#A0A6AF]">{booking.users?.email || booking.guest_phone || '-'}</div>
                  </td>
                  <td className="table-cell-align px-4 py-3 text-sm font-semibold text-[#ff5200]">Rs. {booking.total_price}</td>
                  <td className="table-cell-align px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${booking.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {booking.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="table-cell-align px-4 py-3">
                    <Link href={`/admin/bookings?id=${booking.id}`} className="action-btn inline-flex items-center justify-center rounded-md border border-[#1A1F28] px-3 py-1 text-[13px] font-sans text-[#A0A6AF] transition-colors hover:border-[#ff5200] hover:text-[#F5F1EA]">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
