"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Gamepad2,
  Loader2,
  Phone,
  RefreshCw,
  Search,
  Ticket,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type BookingRow = {
  id: string;
  booking_code: string;
  booking_date: string;
  total_price: number;
  payment_status: string | null;
  payment_mode: string | null;
  check_in_status: string | null;
  setup_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  is_walkin: boolean | null;
  setups?: { id?: string; display_name?: string | null } | null;
  users?: { h_id?: string | null; display_name?: string | null; email?: string | null; phone?: string | null } | null;
  time_slots?: { id?: string; label?: string | null; start_time?: string | null; end_time?: string | null } | null;
  session_types?: { id?: string; name?: string | null; max_players?: number | null } | null;
};

type SetupStatusRow = {
  id: string;
  setup_id: string;
  status: string;
  occupied_since: string | null;
  setups?: { display_name?: string | null; name?: string | null } | null;
};

type WaitlistRow = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  preferred_setup: string | null;
  party_size: number;
  added_at: string;
  status: string;
  notes: string | null;
};

type Setup = { id: string; display_name: string; name?: string | null };
type TimeSlot = { id: string; label: string; start_time: string; end_time: string };
type SessionType = { id: string; name: string; max_players: number };

type Props = {
  initialBookings: BookingRow[];
  initialSetupStatus: SetupStatusRow[];
  initialWaitlist: WaitlistRow[];
  setups: Setup[];
  timeSlots: TimeSlot[];
  sessionTypes: SessionType[];
};

type LookupUser = {
  id: string;
  h_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type TabKey = "schedule" | "walkin" | "phone" | "waitlist" | "setups";

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function statusClass(status: string | null | undefined) {
  if (status === "arrived") return "border-green-500/30 bg-green-500/20 text-green-400";
  if (status === "no_show") return "border-red-500/30 bg-red-500/20 text-red-400";
  return "border-yellow-500/30 bg-yellow-500/20 text-yellow-400";
}

function setupClass(status: string) {
  if (status === "available") return "border-green-500/30 bg-green-500/20 text-green-400";
  if (status === "booked") return "border-yellow-500/30 bg-yellow-500/20 text-yellow-400";
  return "border-red-500/30 bg-red-500/20 text-red-400";
}

function paymentClass(status: string | null | undefined) {
  return status === "paid" ? "border-green-500/30 bg-green-500/20 text-green-400" : "border-yellow-500/30 bg-yellow-500/20 text-yellow-400";
}

export default function CounterDashboard({
  initialBookings,
  initialSetupStatus,
  initialWaitlist,
  setups,
  timeSlots,
  sessionTypes,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const [bookings, setBookings] = useState(initialBookings);
  const [setupStatus, setSetupStatus] = useState(initialSetupStatus);
  const [waitlist, setWaitlist] = useState(initialWaitlist);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupUser, setLookupUser] = useState<LookupUser | null>(null);
  const [walkInForm, setWalkInForm] = useState({
    customerName: "",
    customerPhone: "",
    setupId: setups[0]?.id || "",
    sessionTypeId: sessionTypes[0]?.id || "",
    timeSlotId: timeSlots[0]?.id || "",
    bookingDate: new Date().toISOString().split("T")[0],
    paymentMode: "cash",
  });
  const [phoneBookingForm, setPhoneBookingForm] = useState({
    setupId: setups[0]?.id || "",
    sessionTypeId: sessionTypes[0]?.id || "",
    timeSlotId: timeSlots[0]?.id || "",
    bookingDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [waitlistForm, setWaitlistForm] = useState({
    customerName: "",
    customerPhone: "",
    preferredSetup: "",
    partySize: 1,
    notes: "",
  });
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRow | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTimeSlotId, setRescheduleTimeSlotId] = useState("");

  const totals = useMemo(() => {
    const paidToday = bookings.filter((booking) => booking.payment_status === "paid").reduce((sum, booking) => sum + (booking.total_price || 0), 0);
    const arrived = bookings.filter((booking) => booking.check_in_status === "arrived").length;
    const freeSetups = setupStatus.filter((entry) => entry.status === "available").length;
    return { paidToday, arrived, freeSetups, waiting: waitlist.length };
  }, [bookings, setupStatus, waitlist.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshLiveData();
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  async function fetchJson(path: string, init?: RequestInit) {
    const response = await fetch(path, init);
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  }

  async function refreshLiveData() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [bookingsResult, setupResult, waitlistResult] = await Promise.all([
        fetch(`/api/admin/bookings?date=${today}`),
        fetch("/api/admin/setup-status"),
        fetch("/api/admin/waitlist"),
      ]);

      const bookingsData = await bookingsResult.json();
      const setupData = await setupResult.json();
      const waitlistData = await waitlistResult.json();

      setBookings(bookingsData.bookings || []);
      setSetupStatus(setupData.setups || []);
      setWaitlist(waitlistData.waitlist || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Failed to refresh live data");
    } finally {
      setLoading(false);
    }
  }

  async function handleWalkInSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const { response, payload } = await fetchJson("/api/admin/walkin-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(walkInForm),
    });

    if (!response.ok) {
      setError(payload.error || "Failed to create walk-in booking");
      return;
    }

    setNotice(`Walk-in booking created: ${payload.booking?.code || "success"}`);
    await refreshLiveData();
  }

  async function handleLookup() {
    if (!lookupQuery.trim()) {
      return;
    }

    setError(null);
    setNotice(null);
    const { response, payload } = await fetchJson(`/api/admin/lookup-user?query=${encodeURIComponent(lookupQuery.trim())}`);

    if (!response.ok) {
      setError(payload.error || "Lookup failed");
      return;
    }

    setLookupUser(payload.user || null);
    if (!payload.user) {
      setError("Customer not found by H-ID or phone number");
    }
  }

  async function handlePhoneBooking(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!lookupUser) {
      setError("Lookup a customer first");
      return;
    }

    const { response, payload } = await fetchJson("/api/admin/manual-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hId: lookupUser.h_id,
        customerPhone: lookupUser.phone,
        customerName: lookupUser.display_name,
        bookingDate: phoneBookingForm.bookingDate,
        timeSlotId: phoneBookingForm.timeSlotId,
        sessionTypeId: phoneBookingForm.sessionTypeId,
        setupId: phoneBookingForm.setupId,
        notes: phoneBookingForm.notes,
      }),
    });

    if (!response.ok) {
      setError(payload.error || "Failed to create phone booking");
      return;
    }

    setNotice(`Phone booking created: ${payload.booking?.code || "success"}`);
    await refreshLiveData();
  }

  async function handleWaitlistSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const { response, payload } = await fetchJson("/api/admin/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(waitlistForm),
    });

    if (!response.ok) {
      setError(payload.error || "Failed to add waitlist entry");
      return;
    }

    setNotice(`Waitlist entry added for ${payload.waitlistEntry?.customer_name || "customer"}`);
    setWaitlistForm({ customerName: "", customerPhone: "", preferredSetup: "", partySize: 1, notes: "" });
    await refreshLiveData();
  }

  async function updateWaitlist(waitlistId: string, status: string) {
    const { response, payload } = await fetchJson("/api/admin/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitlistId, status }),
    });

    if (!response.ok) {
      setError(payload.error || "Failed to update waitlist");
      return;
    }

    await refreshLiveData();
  }

  async function handleCheckIn(booking: BookingRow) {
    const { response, payload } = await fetchJson("/api/bookings/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, setupId: booking.setup_id }),
    });

    if (!response.ok) {
      setError(payload.error || "Failed to check in customer");
      return;
    }

    setNotice(`${booking.booking_code} marked as arrived`);
    await refreshLiveData();
  }

  async function handleCancel(booking: BookingRow) {
    if (!window.confirm(`Cancel booking ${booking.booking_code}?`)) {
      return;
    }

    const { response, payload } = await fetchJson("/api/admin/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });

    if (!response.ok) {
      setError(payload.error || "Failed to cancel booking");
      return;
    }

    setNotice(`${booking.booking_code} cancelled`);
    await refreshLiveData();
  }

  async function handleReschedule(event: React.FormEvent) {
    event.preventDefault();
    if (!rescheduleTarget) {
      return;
    }

    const { response, payload } = await fetchJson("/api/bookings/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: rescheduleTarget.id, newDate: rescheduleDate, newTimeSlotId: rescheduleTimeSlotId }),
    });

    if (!response.ok) {
      setError(payload.error || "Failed to reschedule booking");
      return;
    }

    setRescheduleTarget(null);
    setNotice(payload.message || "Booking rescheduled");
    await refreshLiveData();
  }

  const tabButtonClass = (tab: TabKey) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 transition ${activeTab === tab ? "bg-[#FF4500] text-white" : "text-[#A0A6AF] hover:text-white"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF4500]">COUNTER SYSTEM</div>
          <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#F5F1EA]">LIVE COUNTER</h1>
          <div className="mt-2 text-[14px] text-[#A0A6AF]">Operational dashboard for walk-ins, phone bookings, arrivals, and setup availability</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void refreshLiveData()} className="flex items-center gap-2 rounded-lg border border-[#2A2F38] bg-[#14181F] px-4 py-2 text-sm font-medium text-[#F5F1EA] transition hover:border-[#FF4500]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Live Data
          </button>
          <button type="button" onClick={() => router.push("/admin/bookings")} className="flex items-center gap-2 rounded-lg bg-[#FF4500] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#E03E00]">
            <Ticket className="h-4 w-4" />
            All Bookings
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Paid Today" value={formatMoney(totals.paidToday)} icon={Clock3} tone="text-[#4ADE80]" />
        <MetricCard label="Arrived" value={totals.arrived} icon={CheckCircle2} tone="text-[#FF4500]" />
        <MetricCard label="Free Setups" value={totals.freeSetups} icon={Gamepad2} tone="text-[#60A5FA]" />
        <MetricCard label="Waiting" value={totals.waiting} icon={Users} tone="text-[#FACC15]" />
      </div>

      {notice || error ? (
        <div className={`rounded-xl border p-4 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-green-500/30 bg-green-500/10 text-green-400"}`}>
          {error || notice}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-[rgba(255,82,0,0.16)] pb-2">
        <button type="button" onClick={() => setActiveTab("schedule")} className={tabButtonClass("schedule")}><Calendar className="h-4 w-4" />Schedule</button>
        <button type="button" onClick={() => setActiveTab("walkin")} className={tabButtonClass("walkin")}><UserPlus className="h-4 w-4" />Walk-in</button>
        <button type="button" onClick={() => setActiveTab("phone")} className={tabButtonClass("phone")}><Phone className="h-4 w-4" />Phone Booking</button>
        <button type="button" onClick={() => setActiveTab("waitlist")} className={tabButtonClass("waitlist")}><Users className="h-4 w-4" />Waitlist</button>
        <button type="button" onClick={() => setActiveTab("setups")} className={tabButtonClass("setups")}><Gamepad2 className="h-4 w-4" />Setups</button>
      </div>

      {activeTab === "schedule" ? (
        <section className="overflow-hidden rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F]">
          <div className="border-b border-[rgba(255,82,0,0.16)] px-5 py-4">
            <h2 className="font-heading text-[28px] uppercase text-[#F5F1EA]">TODAY&apos;S BOOKINGS</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#0A0F18] text-left text-[12px] uppercase tracking-widest text-[#A0A6AF]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Setup</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Check-in</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length ? bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-[#2A2F38] text-[14px] text-[#F5F1EA]">
                    <td className="px-4 py-3 font-mono text-[#FF4500]">{booking.booking_code}</td>
                    <td className="px-4 py-3">{booking.time_slots?.label || "-"}</td>
                    <td className="px-4 py-3">
                      <div>{booking.guest_name || booking.users?.display_name || booking.users?.email || "Customer"}</div>
                      <div className="text-xs text-[#A0A6AF]">{booking.guest_phone || booking.users?.phone || booking.users?.h_id || "-"}</div>
                    </td>
                    <td className="px-4 py-3">{booking.setups?.display_name || "-"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${paymentClass(booking.payment_status)}`}>{booking.payment_status || "pending"}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusClass(booking.check_in_status)}`}>{booking.check_in_status || "pending"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {booking.check_in_status !== "arrived" ? <button type="button" onClick={() => void handleCheckIn(booking)} className="rounded-md bg-green-500/20 px-3 py-1 text-xs text-green-400 transition hover:bg-green-500/30">Check-in</button> : null}
                        <button type="button" onClick={() => {
                          setRescheduleTarget(booking);
                          setRescheduleDate(booking.booking_date);
                          setRescheduleTimeSlotId(booking.time_slots?.id || "");
                        }} className="rounded-md bg-blue-500/20 px-3 py-1 text-xs text-blue-400 transition hover:bg-blue-500/30">Reschedule</button>
                        <button type="button" onClick={() => void handleCancel(booking)} className="rounded-md bg-red-500/20 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/30">Cancel</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A0A6AF]">No bookings today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "walkin" ? (
        <form onSubmit={handleWalkInSubmit} className="space-y-4 rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
          <h2 className="font-heading text-[28px] uppercase text-[#F5F1EA]">WALK-IN BOOKING</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Customer Name" value={walkInForm.customerName} onChange={(value) => setWalkInForm({ ...walkInForm, customerName: value })} />
            <Field label="Phone Number" value={walkInForm.customerPhone} onChange={(value) => setWalkInForm({ ...walkInForm, customerPhone: value })} />
            <SelectField label="Setup" value={walkInForm.setupId} onChange={(value) => setWalkInForm({ ...walkInForm, setupId: value })} options={setups.map((setup) => ({ value: setup.id, label: setup.display_name }))} />
            <SelectField label="Session" value={walkInForm.sessionTypeId} onChange={(value) => setWalkInForm({ ...walkInForm, sessionTypeId: value })} options={sessionTypes.map((session) => ({ value: session.id, label: session.name }))} />
            <Field label="Date" type="date" value={walkInForm.bookingDate} onChange={(value) => setWalkInForm({ ...walkInForm, bookingDate: value })} />
            <SelectField label="Time Slot" value={walkInForm.timeSlotId} onChange={(value) => setWalkInForm({ ...walkInForm, timeSlotId: value })} options={timeSlots.map((slot) => ({ value: slot.id, label: slot.label }))} />
            <SelectField label="Payment Mode" value={walkInForm.paymentMode} onChange={(value) => setWalkInForm({ ...walkInForm, paymentMode: value })} options={[{ value: "cash", label: "Cash" }, { value: "upi", label: "UPI" }]} />
          </div>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#FF4500] px-5 py-3 font-semibold text-white transition hover:bg-[#E03E00]">
            <UserPlus className="h-4 w-4" /> Create Walk-in Booking
          </button>
        </form>
      ) : null}

      {activeTab === "phone" ? (
        <div className="space-y-4 rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
          <h2 className="font-heading text-[28px] uppercase text-[#F5F1EA]">PHONE BOOKING</h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <Field label="Lookup by H-ID or phone" value={lookupQuery} onChange={setLookupQuery} placeholder="HID-000123 or 9876543210" />
            <button type="button" onClick={() => void handleLookup()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2A2F38] bg-[#0A0F18] px-5 py-3 text-[#F5F1EA] transition hover:border-[#FF4500]">
              <Search className="h-4 w-4" /> Find Customer
            </button>
          </div>

          {lookupUser ? (
            <div className="rounded-xl border border-[#2A2F38] bg-[#0A0F18] p-4 text-sm text-[#A0A6AF]">
              Found: <span className="text-[#F5F1EA]">{lookupUser.display_name || lookupUser.email || "Customer"}</span> · <span className="font-mono text-[#FF4500]">{lookupUser.h_id || lookupUser.phone || "No reference"}</span>
            </div>
          ) : null}

          <form onSubmit={handlePhoneBooking} className="grid gap-4 md:grid-cols-2">
            <SelectField label="Setup" value={phoneBookingForm.setupId} onChange={(value) => setPhoneBookingForm({ ...phoneBookingForm, setupId: value })} options={setups.map((setup) => ({ value: setup.id, label: setup.display_name }))} />
            <SelectField label="Session" value={phoneBookingForm.sessionTypeId} onChange={(value) => setPhoneBookingForm({ ...phoneBookingForm, sessionTypeId: value })} options={sessionTypes.map((session) => ({ value: session.id, label: session.name }))} />
            <Field label="Date" type="date" value={phoneBookingForm.bookingDate} onChange={(value) => setPhoneBookingForm({ ...phoneBookingForm, bookingDate: value })} />
            <SelectField label="Time Slot" value={phoneBookingForm.timeSlotId} onChange={(value) => setPhoneBookingForm({ ...phoneBookingForm, timeSlotId: value })} options={timeSlots.map((slot) => ({ value: slot.id, label: slot.label }))} />
            <div className="md:col-span-2">
              <Field label="Notes" value={phoneBookingForm.notes} onChange={(value) => setPhoneBookingForm({ ...phoneBookingForm, notes: value })} placeholder="Optional notes for the counter" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#FF4500] px-5 py-3 font-semibold text-white transition hover:bg-[#E03E00]">
                <Phone className="h-4 w-4" /> Create Phone Booking
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {activeTab === "waitlist" ? (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <form onSubmit={handleWaitlistSubmit} className="space-y-4 rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
            <h2 className="font-heading text-[28px] uppercase text-[#F5F1EA]">WAITLIST</h2>
            <Field label="Customer Name" value={waitlistForm.customerName} onChange={(value) => setWaitlistForm({ ...waitlistForm, customerName: value })} />
            <Field label="Phone" value={waitlistForm.customerPhone} onChange={(value) => setWaitlistForm({ ...waitlistForm, customerPhone: value })} />
            <Field label="Preferred Setup" value={waitlistForm.preferredSetup} onChange={(value) => setWaitlistForm({ ...waitlistForm, preferredSetup: value })} placeholder="PS5 / Racing / Any" />
            <Field label="Party Size" type="number" value={String(waitlistForm.partySize)} onChange={(value) => setWaitlistForm({ ...waitlistForm, partySize: parseInt(value || "1", 10) || 1 })} />
            <Field label="Notes" value={waitlistForm.notes} onChange={(value) => setWaitlistForm({ ...waitlistForm, notes: value })} />
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#FF4500] px-5 py-3 font-semibold text-white transition hover:bg-[#E03E00]">Add to Waitlist</button>
          </form>

          <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-[28px] uppercase text-[#F5F1EA]">QUEUE</h3>
              <span className="rounded-full border border-[#2A2F38] px-3 py-1 text-xs text-[#A0A6AF]">{waitlist.length} waiting</span>
            </div>
            <div className="space-y-3">
              {waitlist.length ? waitlist.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-[#2A2F38] bg-[#0A0F18] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-[#F5F1EA]">{entry.customer_name}</div>
                      <div className="text-xs text-[#A0A6AF]">{entry.customer_phone || "No phone"}</div>
                      <div className="mt-1 text-xs text-[#FF4500]">{entry.preferred_setup || "Any setup"} · {entry.party_size} player(s)</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void updateWaitlist(entry.id, "notified")} className="rounded-md bg-blue-500/20 px-3 py-1 text-xs text-blue-400 transition hover:bg-blue-500/30">Notify</button>
                      <button type="button" onClick={() => void updateWaitlist(entry.id, "completed")} className="rounded-md bg-green-500/20 px-3 py-1 text-xs text-green-400 transition hover:bg-green-500/30">Completed</button>
                      <button type="button" onClick={() => void updateWaitlist(entry.id, "cancelled")} className="rounded-md bg-red-500/20 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/30">Cancel</button>
                    </div>
                  </div>
                </div>
              )) : <div className="py-10 text-center text-[#A0A6AF]">No customers waiting</div>}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "setups" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {setupStatus.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-heading text-[22px] uppercase text-[#F5F1EA]">{entry.setups?.display_name || "Setup"}</div>
                  <div className="text-xs text-[#A0A6AF]">{entry.setups?.name || ""}</div>
                </div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${setupClass(entry.status)}`}>{entry.status}</span>
              </div>
              {entry.occupied_since ? <div className="mt-3 text-xs text-[#A0A6AF]">Occupied since {new Date(entry.occupied_since).toLocaleTimeString()}</div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {rescheduleTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <form onSubmit={handleReschedule} className="w-full max-w-lg rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-[28px] uppercase text-[#F5F1EA]">Reschedule Booking</h3>
              <button type="button" onClick={() => setRescheduleTarget(null)} className="rounded-lg p-2 text-[#A0A6AF]"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <Field label="New Date" type="date" value={rescheduleDate} onChange={setRescheduleDate} />
              <SelectField label="New Time Slot" value={rescheduleTimeSlotId} onChange={setRescheduleTimeSlotId} options={timeSlots.map((slot) => ({ value: slot.id, label: slot.label }))} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRescheduleTarget(null)} className="flex-1 rounded-xl border border-[#2A2F38] px-4 py-3 text-[#A0A6AF]">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl bg-[#FF4500] px-4 py-3 font-semibold text-white">Save</button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; tone: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[13px] text-[#A0A6AF]">{label}</div>
        <Icon className="h-4 w-4 text-[#A0A6AF]" />
      </div>
      <div className={`mt-3 font-heading text-[42px] uppercase ${tone}`}>{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-[#A0A6AF]">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#2A2F38] bg-[#0A0F18] px-4 py-3 text-[#F5F1EA] outline-none focus:border-[#FF4500]"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-[#A0A6AF]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#2A2F38] bg-[#0A0F18] px-4 py-3 text-[#F5F1EA] outline-none focus:border-[#FF4500]"
      >
        <option value="">Select {label}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
