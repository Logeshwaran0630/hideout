'use client';

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Eye, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type BookingRow = {
  id: string;
  booking_code: string;
  booking_date: string;
  total_price: number;
  status: string;
  users?: { h_id: string; display_name: string | null; email: string | null } | null;
  time_slots?: { label: string; start_time: string } | null;
  session_types?: { name: string; price_per_hour: number } | null;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

const statusBadgeClasses: Record<string, string> = {
  confirmed: "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ADE80]",
  cancelled: "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444]",
  completed: "border-[rgba(161,161,170,0.3)] bg-[rgba(161,161,170,0.1)] text-[#A1A1AA]",
};

export default function BookingsClient({ bookings, filters }: { bookings: BookingRow[]; filters: { date?: string; status?: string; search?: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null);
  const [viewTarget, setViewTarget] = useState<BookingRow | null>(null);

  const status = filters.status ?? "";
  const date = filters.date ?? "";
  const search = filters.search ?? "";

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF3A3A]">BOOKINGS</div>
          <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#FAFAFA]">ALL BOOKINGS</h1>
        </div>
        <div className="text-[14px] text-[#A1A1AA]">{bookings.length} bookings</div>
      </div>

      <div className="mb-6 rounded-xl border border-[#27272A] bg-[#18181B] p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="date"
            value={date}
            onChange={(e) => updateParams({ date: e.target.value || undefined })}
            className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-[14px] text-[#FAFAFA] outline-none focus:border-[#FF3A3A]"
          />
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value || undefined })}
            className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-[14px] text-[#FAFAFA] outline-none focus:border-[#FF3A3A]"
          >
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#A1A1AA]" />
            <input
              value={search}
              onChange={(e) => updateParams({ search: e.target.value || undefined })}
              placeholder="Search H-ID or booking code..."
              className="w-full rounded-lg border border-[#27272A] bg-[#09090B] py-3 pl-9 pr-4 text-[14px] text-[#FAFAFA] outline-none focus:border-[#FF3A3A]"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#27272A] bg-[#18181B]">
        <table className="w-full border-collapse">
          <thead className="bg-[#09090B]">
            <tr className="border-b border-[#27272A]">
              {['Code', 'Date', 'Time', 'User', 'Session', 'Price', 'Status', 'Actions'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-[12px] font-medium uppercase tracking-widest text-[#A1A1AA]">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-[#27272A] transition-colors hover:bg-[#18181B]">
                <td className="px-4 py-4 font-mono text-[13px] text-[#FF3A3A]">{booking.booking_code}</td>
                <td className="px-4 py-4 text-[14px] text-[#FAFAFA]">{formatDate(booking.booking_date)}</td>
                <td className="px-4 py-4 text-[14px] text-[#A1A1AA]">{booking.time_slots?.label}</td>
                <td className="px-4 py-4">
                  <div className="font-mono text-[12px] text-[#FF3A3A]">{booking.users?.h_id}</div>
                  <div className="text-[12px] text-[#71717A]">{booking.users?.display_name || booking.users?.email}</div>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-[rgba(255,58,58,0.3)] bg-[rgba(255,58,58,0.1)] px-2 py-0.5 text-[12px] font-medium text-[#FF3A3A]">{booking.session_types?.name}</span>
                </td>
                <td className="px-4 py-4 text-[14px] font-semibold text-[#FAFAFA]">₹{booking.total_price}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${statusBadgeClasses[booking.status] || statusBadgeClasses.completed}`}>{booking.status}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setViewTarget(booking)} className="rounded-md border border-[#27272A] p-2 text-[#A1A1AA] transition-colors hover:border-[#FF3A3A] hover:text-[#FAFAFA]" aria-label="View booking">
                      <Eye className="h-4 w-4" />
                    </button>
                    {booking.status === 'confirmed' ? (
                      <button type="button" onClick={() => setCancelTarget(booking)} className="rounded-md border border-[#27272A] p-2 text-[#EF4444] transition-colors hover:border-[#EF4444]" aria-label="Cancel booking">
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewTarget ? (
        <ViewModal booking={viewTarget} onClose={() => setViewTarget(null)} />
      ) : null}

      {cancelTarget ? (
        <CancelModal booking={cancelTarget} onClose={() => setCancelTarget(null)} onCancelled={async () => {
          await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', cancelTarget.id);
          setCancelTarget(null);
          router.refresh();
        }} />
      ) : null}
    </div>
  );
}

function ViewModal({ booking, onClose }: { booking: BookingRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border border-[#27272A] bg-[#18181B] p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-[32px] uppercase text-[#FAFAFA]">BOOKING DETAILS</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-[#A1A1AA] hover:text-[#FAFAFA]"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-3 text-[14px] text-[#A1A1AA]">
          <div><span className="text-[#FAFAFA]">Code:</span> <span className="font-mono text-[#FF3A3A]">{booking.booking_code}</span></div>
          <div><span className="text-[#FAFAFA]">Date:</span> {booking.booking_date}</div>
          <div><span className="text-[#FAFAFA]">Time:</span> {booking.time_slots?.label}</div>
          <div><span className="text-[#FAFAFA]">User:</span> {booking.users?.display_name || booking.users?.email}</div>
          <div><span className="text-[#FAFAFA]">H-ID:</span> <span className="font-mono text-[#FF3A3A]">{booking.users?.h_id}</span></div>
          <div><span className="text-[#FAFAFA]">Session:</span> {booking.session_types?.name}</div>
          <div><span className="text-[#FAFAFA]">Price:</span> ₹{booking.total_price}</div>
          <div><span className="text-[#FAFAFA]">Status:</span> {booking.status}</div>
        </div>
      </div>
    </div>
  );
}

function CancelModal({ booking, onClose, onCancelled }: { booking: BookingRow; onClose: () => void; onCancelled: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#EF4444] bg-[#18181B] p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-[32px] uppercase text-[#FAFAFA]">CANCEL BOOKING?</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-[#A1A1AA] hover:text-[#FAFAFA]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-4 text-[15px] text-[#A1A1AA]">
          This will cancel booking <span className="font-mono text-[#FF3A3A]">{booking.booking_code}</span>. The slot will be freed. This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#27272A] px-4 py-3 text-[14px] text-[#A1A1AA] hover:text-[#FAFAFA]">Keep Booking</button>
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await onCancelled();
              setLoading(false);
            }}
            className="flex-1 rounded-lg bg-[#EF4444] px-4 py-3 text-[14px] font-semibold text-[#FAFAFA]"
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel It'}
          </button>
        </div>
      </div>
    </div>
  );
}
