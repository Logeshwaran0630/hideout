'use client';

import { useEffect, useState } from "react";

function exportCSV(bookings: any[]) {
  const headers = ["Code", "Date", "Time", "User H-ID", "Session", "Price", "Status"];
  const rows = bookings.map((b) => [
    b.booking_code,
    b.booking_date,
    b.time_slots?.label,
    b.users?.h_id,
    b.session_types?.name,
    b.total_price,
    b.status,
  ]);
  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hideout-bookings-${Date.now()}.csv`;
  a.click();
}

export default function AdminSettingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/bookings-export')
      .then((response) => response.json())
      .then((data) => setBookings(data.bookings ?? []))
      .catch(() => setBookings([]));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF3A3A]">SETTINGS</div>
        <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#FAFAFA]">SETTINGS</h1>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
          <div className="text-[16px] font-semibold text-[#FAFAFA]">Venue Details</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {['The Hideout', 'Chennai', '11:00 AM', '11:00 PM', '+91 9XXXXXXXXX'].map((value, index) => (
              <input key={value} defaultValue={value} className="rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-[#FAFAFA] outline-none focus:border-[#FF3A3A]" />
            ))}
          </div>
          <div className="mt-3 text-[12px] text-[#71717A]">These values are display-only for now. Backend config coming soon.</div>
          <button type="button" className="mt-4 rounded-lg bg-[#FF3A3A] px-5 py-3 text-[14px] font-semibold text-[#09090B]">Save Changes</button>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
          <div className="text-[16px] font-semibold text-[#FAFAFA]">H Coin Configuration</div>
          <div className="mt-4 grid gap-2 text-[14px] text-[#A1A1AA] md:grid-cols-2">
            <div>Solo session: <span className="text-[#FAFAFA]">10 coins</span></div>
            <div>Duo session: <span className="text-[#FAFAFA]">15 coins</span></div>
            <div>Squad session: <span className="text-[#FAFAFA]">25 coins</span></div>
            <div>Free session threshold: <span className="text-[#FAFAFA]">100 coins</span></div>
          </div>
          <div className="mt-3 text-[12px] text-[#71717A]">Coin rules are set in the database trigger. Edit the function to change values.</div>
        </div>

        <div className="rounded-xl border border-[rgba(239,68,68,0.3)] bg-[#18181B] p-6">
          <div className="text-[16px] font-semibold text-[#EF4444]">Danger Zone</div>
          <div className="mt-4 space-y-3 text-[14px] text-[#A1A1AA]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>Mark all past bookings as completed</div>
              <button type="button" className="rounded-lg border border-[#EF4444] px-4 py-2 text-[#EF4444]">Run</button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>Export all bookings as CSV</div>
              <button type="button" onClick={() => exportCSV(bookings)} className="rounded-lg border border-[#27272A] px-4 py-2 text-[#A1A1AA]">Export</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
