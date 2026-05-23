'use client';

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, Search, X } from "lucide-react";

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
  calendar_event_id?: string | null;
  setups?: { display_name: string } | null;
  users?: { h_id: string; display_name: string | null; email: string | null } | null;
  time_slots?: { label: string; start_time: string; end_time?: string } | null;
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
  completed: "border-[rgba(161,161,170,0.3)] bg-[rgba(161,161,170,0.1)] text-[#A0A6AF]",
};

const paymentStatusClasses: Record<string, string> = {
  paid: "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ADE80]",
  pending: "border-[rgba(250,204,21,0.3)] bg-[rgba(250,204,21,0.1)] text-[#FACC15]",
};

const paymentModeClasses: Record<string, string> = {
  cash: "border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]",
  upi: "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ADE80]",
};

function PaymentBadge({ status }: { status?: string | null }) {
  const normalizedStatus = status ?? "pending";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${paymentStatusClasses[normalizedStatus] || paymentStatusClasses.pending}`}>
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
    <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium uppercase ${paymentModeClasses[normalizedMode] || paymentModeClasses.cash}`}>
      {normalizedMode}
    </span>
  );
}

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function BookingsClient({ bookings, filters }: { bookings: BookingRow[]; filters: { date?: string; status?: string; search?: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null);
  const [viewTarget, setViewTarget] = useState<BookingRow | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<BookingRow | null>(null);

  const status = filters.status ?? "";
  const date = filters.date ?? "";
  const search = filters.search ?? "";
  const paymentStatus = (filters as { paymentStatus?: string }).paymentStatus ?? "";

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
          <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#F5F1EA]">ALL BOOKINGS</h1>
        </div>
        <div className="text-[14px] text-[#A0A6AF]">{bookings.length} bookings</div>
      </div>

      <div className="mb-6 rounded-xl border border-[#2A2F38] bg-[#14181F] p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="date"
            value={date}
            onChange={(e) => updateParams({ date: e.target.value || undefined })}
            className="w-full rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-3 text-[14px] text-[#F5F1EA] outline-none focus:border-[#FF3A3A]"
          />
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value || undefined })}
            className="w-full rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-3 text-[14px] text-[#F5F1EA] outline-none focus:border-[#FF3A3A]"
          >
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => updateParams({ paymentStatus: e.target.value || undefined })}
            className="w-full rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-3 text-[14px] text-[#F5F1EA] outline-none focus:border-[#FF3A3A]"
          >
            <option value="">Payment: All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#A0A6AF]" />
            <input
              value={search}
              onChange={(e) => updateParams({ search: e.target.value || undefined })}
              placeholder="Search H-ID or booking code..."
              className="w-full rounded-lg border border-[#2A2F38] bg-[#0A0F18] py-3 pl-9 pr-4 text-[14px] text-[#F5F1EA] outline-none focus:border-[#FF3A3A]"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#2A2F38] bg-[#14181F]">
        <table className="w-full border-collapse">
          <thead className="bg-[#0A0F18]">
            <tr className="border-b border-[#2A2F38]">
              {['Code', 'Date', 'Time', 'User', 'Setup', 'Session', 'Price', 'Status', 'Payment', 'Mode', 'Actions'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-[12px] font-medium uppercase tracking-widest text-[#A0A6AF]">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-[#2A2F38] transition-colors hover:bg-[#14181F]">
                <td className="px-4 py-4 font-mono text-[13px] text-[#ff5200]">{booking.booking_code}</td>
                <td className="px-4 py-4 text-[14px] text-[#F5F1EA]">{formatDate(booking.booking_date)}</td>
                <td className="px-4 py-4 text-[14px] text-[#A0A6AF]">{booking.time_slots?.label}</td>
                <td className="px-4 py-4">
                  <div className="font-mono text-[12px] text-[#ff5200]">{booking.users?.h_id}</div>
                  <div className="text-[12px] text-[#71717A]">{booking.users?.display_name || booking.users?.email}</div>
                </td>
                <td className="px-4 py-4 text-[14px] font-semibold text-[#F5F1EA]">{booking.setups?.display_name || '-'}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-[rgba(255,58,58,0.3)] bg-[rgba(255,58,58,0.1)] px-2 py-0.5 text-[12px] font-medium text-[#FF3A3A]">{booking.session_types?.name}</span>
                </td>
                <td className="px-4 py-4 text-[14px] font-semibold text-[#ff5200]">₹{booking.total_price}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${statusBadgeClasses[booking.status] || statusBadgeClasses.completed}`}>{booking.status}</span>
                </td>
                <td className="px-4 py-4">
                  <PaymentBadge status={booking.payment_status} />
                </td>
                <td className="px-4 py-4">
                  <PaymentModeBadge mode={booking.payment_mode} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setViewTarget(booking)} className="rounded-md border border-[#2A2F38] p-2 text-[#A0A6AF] transition-colors hover:border-[#FF3A3A] hover:text-[#F5F1EA]" aria-label="View booking">
                      <Eye className="h-4 w-4" />
                    </button>
                    {booking.payment_status !== 'paid' ? (
                      <button type="button" onClick={() => setMarkPaidTarget(booking)} className="rounded-md border border-[#2A2F38] p-2 text-[#4ADE80] transition-colors hover:border-[#4ADE80]" aria-label="Mark booking as paid">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    {booking.status === 'confirmed' ? (
                      <button type="button" onClick={() => setCancelTarget(booking)} className="rounded-md border border-[#2A2F38] p-2 text-[#EF4444] transition-colors hover:border-[#EF4444]" aria-label="Cancel booking">
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
          setCancelTarget(null);
          router.refresh();
        }} />
      ) : null}

      {markPaidTarget ? (
        <MarkPaidModal
          booking={markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onSuccess={async () => {
            setMarkPaidTarget(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function ViewModal({ booking, onClose }: { booking: BookingRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border border-[#2A2F38] bg-[#14181F] p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-[32px] uppercase text-[#F5F1EA]">BOOKING DETAILS</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-[#A0A6AF] hover:text-[#F5F1EA]"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-3 text-[14px] text-[#A0A6AF]">
          <div><span className="text-[#F5F1EA]">Code:</span> <span className="font-mono text-[#ff5200]">{booking.booking_code}</span></div>
          <div><span className="text-[#F5F1EA]">Date:</span> {booking.booking_date}</div>
          <div><span className="text-[#F5F1EA]">Time:</span> {booking.time_slots?.label}</div>
          <div><span className="text-[#F5F1EA]">User:</span> {booking.users?.display_name || booking.users?.email}</div>
          <div><span className="text-[#F5F1EA]">H-ID:</span> <span className="font-mono text-[#ff5200]">{booking.users?.h_id}</span></div>
          <div><span className="text-[#F5F1EA]">Setup:</span> {booking.setups?.display_name || '-'}</div>
          <div><span className="text-[#F5F1EA]">Session:</span> {booking.session_types?.name}</div>
          <div><span className="text-[#F5F1EA]">Price:</span> <span className="font-semibold text-[#ff5200]">₹{booking.total_price}</span></div>
          <div><span className="text-[#F5F1EA]">Status:</span> {booking.status}</div>
        </div>
      </div>
    </div>
  );
}

function CancelModal({ booking, onClose, onCancelled }: { booking: BookingRow; onClose: () => void; onCancelled: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#EF4444] bg-[#14181F] p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-[32px] uppercase text-[#F5F1EA]">CANCEL BOOKING?</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-[#A0A6AF] hover:text-[#F5F1EA]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-4 text-[15px] text-[#A0A6AF]">
          This will cancel booking <span className="font-mono text-[#FF3A3A]">{booking.booking_code}</span>. The slot will be freed. This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#2A2F38] px-4 py-3 text-[14px] text-[#A0A6AF] hover:text-[#F5F1EA]">Keep Booking</button>
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const response = await fetch('/api/admin/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking.id }),
              });

              if (!response.ok) {
                const payload = await response.json().catch(() => null);
                console.error('Failed to cancel booking:', payload || response.statusText);
                setLoading(false);
                return;
              }

              await onCancelled();
              setLoading(false);
            }}
            className="flex-1 rounded-lg bg-[#EF4444] px-4 py-3 text-[14px] font-semibold text-[#F5F1EA]"
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel It'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MarkPaidModal({ booking, onClose, onSuccess }: { booking: BookingRow; onClose: () => void; onSuccess: () => Promise<void> }) {
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border border-[#2A2F38] bg-[#14181F] p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-[32px] uppercase text-[#F5F1EA]">MARK PAID</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-[#A0A6AF] hover:text-[#F5F1EA]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[#2A2F38] bg-[#0A0F18] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-[#A0A6AF]">Booking</span>
            <span className="font-mono text-[13px] text-[#FF3A3A]">{booking.booking_code}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[13px] text-[#A0A6AF]">Customer</span>
            <span className="text-[13px] text-[#F5F1EA]">{booking.users?.display_name || booking.users?.email}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[13px] text-[#A0A6AF]">Amount</span>
            <span className="text-[15px] font-semibold text-[#F5F1EA]">{formatMoney(booking.total_price)}</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[13px] font-medium uppercase tracking-[0.15em] text-[#A0A6AF]">Payment mode</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMode('cash')}
              className={`rounded-xl border px-4 py-3 text-[14px] font-semibold transition-colors ${paymentMode === 'cash' ? 'border-[#60A5FA] bg-[rgba(96,165,250,0.12)] text-[#F5F1EA]' : 'border-[#2A2F38] bg-[#0A0F18] text-[#A0A6AF]'}`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('upi')}
              className={`rounded-xl border px-4 py-3 text-[14px] font-semibold transition-colors ${paymentMode === 'upi' ? 'border-[#4ADE80] bg-[rgba(74,222,128,0.12)] text-[#F5F1EA]' : 'border-[#2A2F38] bg-[#0A0F18] text-[#A0A6AF]'}`}
            >
              UPI
            </button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-[13px] text-[#EF4444]">{error}</div> : null}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#2A2F38] px-4 py-3 text-[14px] text-[#A0A6AF] hover:text-[#F5F1EA]">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);

              const response = await fetch('/api/admin/bookings/mark-paid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking.id, paymentMode }),
              });

              const payload = await response.json().catch(() => null);

              if (!response.ok) {
                setError(payload?.error || 'Failed to mark booking as paid');
                setLoading(false);
                return;
              }

              await onSuccess();
              setLoading(false);
            }}
            className="flex-1 rounded-lg bg-[#4ADE80] px-4 py-3 text-[14px] font-semibold text-[#0A0F18] disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Confirm Paid'}
          </button>
        </div>
      </div>
    </div>
  );
}
