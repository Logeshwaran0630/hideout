'use client';

import Navbar from "@/components/Navbar";
import SlotCard from "@/components/SlotCard";
import { supabase } from "@/lib/supabase/client";
import { checkMultipleSlotsAvailability, createCalendarEvent } from "@/lib/googleCalendarClient";
import { createISTDate, formatIST, toISTISO } from "@/lib/indianTime";
import { Check, CheckCircle2, Copy, Loader2, Sparkles, User, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SessionType = {
  id: string;
  name: string;
  max_players: number;
  price_per_hour: number;
  description: string | null;
  h_coins_earned: number | null;
  sort_order?: number | null;
};

type Profile = {
  h_id: string;
  display_name: string | null;
  email: string | null;
};

type BookingResult = {
  id: string;
  booking_code: string;
  booking_date: string;
  total_price: number;
  session_type_id: string;
  time_slot_id: string;
  time_slots?: TimeSlot;
  session_types?: SessionType;
};

type TimeSlot = {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  sort_order: number;
};

type SlotRecord = TimeSlot & {
  state: "available" | "selected" | "booked" | "past";
};

type BookingWizardProps = {
  sessionTypes: SessionType[];
  user: { id: string; email: string };
  profile: Profile | null;
};

function formatDateLabel(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSlotPast(startTime: string, date: string) {
  const now = new Date();
  const slotDateTime = createISTDate(date, startTime);
  return slotDateTime < now;
}

export default function BookingWizard({ sessionTypes, user, profile }: BookingWizardProps) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [step, setStep] = useState<1 | 2 | 3 | "confirmed">(1);
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(new Date()));
  const [selectedSessionTypeId, setSelectedSessionTypeId] = useState(sessionTypes[0]?.id ?? "");
  const [loadedSessionTypes, setLoadedSessionTypes] = useState(sessionTypes);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<SlotRecord[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [copiedBookingCode, setCopiedBookingCode] = useState(false);

  const selectedSessionType = loadedSessionTypes.find((item) => item.id === selectedSessionTypeId) ?? loadedSessionTypes[0] ?? null;
  const selectedSlot = availableSlots.find((slot) => slot.id === selectedSlotId) ?? null;

  const dates = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return {
        value: toLocalDateString(date),
        dayName: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
        isToday: index === 0,
      };
    });
  }, [today]);

  useEffect(() => {
    if (loadedSessionTypes.length > 0) return;

    let active = true;

    async function fetchSessionTypes() {
      let response = await supabase
        .from("session_types")
        .select("*")
        .order("sort_order", { ascending: true });

      if (response.error) {
        response = await supabase
          .from("session_types")
          .select("*")
          .order("price_per_hour", { ascending: true });
      }

      if (!active) return;

      const nextSessionTypes = (response.data ?? []) as SessionType[];
      setLoadedSessionTypes(nextSessionTypes);
      setSelectedSessionTypeId((current) => current || nextSessionTypes[0]?.id || "");
    }

    void fetchSessionTypes();

    return () => {
      active = false;
    };
  }, [loadedSessionTypes.length]);

  useEffect(() => {
    if (step !== 2) return;

    let cancelled = false;

    async function fetchAvailability() {
      setAvailabilityLoading(true);
      setError(null);

      try {
        // Get all time slots
        const { data: allSlots } = await supabase
          .from("time_slots")
          .select("*")
          .order("sort_order");

        if (!allSlots) {
          throw new Error("Could not fetch time slots");
        }

        const slotsToCheck = allSlots.map((slot: TimeSlot) => {
          return {
            slotId: slot.id,
            start: createISTDate(selectedDate, slot.start_time),
            end: createISTDate(selectedDate, slot.end_time),
          };
        });

        const availabilityMap = await checkMultipleSlotsAvailability(slotsToCheck);

        if (cancelled) return;

        setAvailableSlots(
          allSlots.map((slot: TimeSlot) => {
            const isAvailable = availabilityMap.get(slot.id) ?? true;
            return {
              ...slot,
              state: !isAvailable
                ? "booked"
                : isSlotPast(slot.start_time, selectedDate)
                  ? "past"
                  : slot.id === selectedSlotId
                    ? "selected"
                    : "available",
            };
          })
        );
        setAvailabilityLoading(false);
      } catch (err) {
        console.error('Error fetching availability:', err);
        if (!cancelled) {
          setAvailabilityLoading(false);
          setError("Couldn't load slot availability. Please try again.");
        }
      }
    }

    void fetchAvailability();

    return () => {
      cancelled = true;
    };
  }, [step, selectedDate, selectedSlotId]);

  async function confirmBooking() {
    if (!selectedSlot || !selectedSessionType) return;

    setLoadingConfirm(true);
    setError(null);

    try {
      let calendarEventId: string | null = null;
      const startDateTime = createISTDate(selectedDate, selectedSlot.start_time);
      const endDateTime = createISTDate(selectedDate, selectedSlot.end_time);

      console.log("Booking DateTime (IST):", {
        selectedDate,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
        startIST: formatIST(startDateTime),
        endIST: formatIST(endDateTime),
        startISO: startDateTime.toISOString(),
        endISO: endDateTime.toISOString(),
      });

      calendarEventId = await createCalendarEvent({
        summary: `Hideout Booking - ${profile?.display_name || "Guest"} (${profile?.h_id || 'N/A'})`,
        description: `
Booking Details:
- Session Type: ${selectedSessionType.name}
- Players: ${selectedSessionType.max_players}
- Price: ₹${selectedSessionType.price_per_hour}/hour
- H-ID: ${profile?.h_id || 'N/A'}
- Email: ${profile?.email || user.email || 'N/A'}
        `.trim(),
        startTime: toISTISO(selectedDate, selectedSlot.start_time),
        endTime: toISTISO(selectedDate, selectedSlot.end_time),
      });

      if (!calendarEventId) {
        setError("Failed to create calendar event. Please try again.");
        setLoadingConfirm(false);
        return;
      }

      // THEN: Create booking in Supabase with calendar_event_id
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time_slot_id: selectedSlot.id,
          session_type_id: selectedSessionType.id,
          booking_date: selectedDate,
          calendar_event_id: calendarEventId,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setError("This slot was just booked by someone else. Please choose another.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        setLoadingConfirm(false);
        return;
      }

      const payload = (await response.json()) as { booking: BookingResult };
      setBookingResult(payload.booking);
      setLoadingConfirm(false);
      setStep("confirmed");
    } catch (err) {
      console.error('Error confirming booking:', err);
      setError("Something went wrong. Please try again.");
      setLoadingConfirm(false);
    }
  }

  async function copyBookingCode() {
    if (!bookingResult?.booking_code) return;
    await navigator.clipboard.writeText(bookingResult.booking_code);
    setCopiedBookingCode(true);
    setTimeout(() => setCopiedBookingCode(false), 2000);
  }

  const bookingCoinAmount = selectedSessionType?.h_coins_earned ?? (selectedSessionType?.name === "Duo" ? 15 : selectedSessionType?.name === "Squad" ? 25 : 10);
  const currentStepNumber = step === "confirmed" ? 3 : step;

  if (step === "confirmed" && bookingResult && selectedSlot && selectedSessionType) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
        <Navbar />
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#A855F7] bg-[#18181B] glow-purple animate-[bookingPulse_400ms_ease-out]">
            <CheckCircle2 className="h-10 w-10 text-[#A855F7]" />
          </div>
          <h1 className="mt-8 font-heading text-[48px] uppercase text-[#FAFAFA]">YOU&apos;RE IN!</h1>
          <p className="mt-2 text-[16px] text-[#A1A1AA]">Your slot is locked in. See you at The Hideout.</p>

          <div className="mt-8 w-full rounded-xl border border-[#A855F7] bg-[#18181B] p-8 text-center glow-purple">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#A1A1AA]">BOOKING CODE</div>
            <div className="mt-4 font-mono text-[36px] tracking-widest text-[#A855F7] glow-text">{bookingResult.booking_code}</div>
            <button type="button" onClick={copyBookingCode} className="mt-4 inline-flex items-center gap-2 text-[13px] text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]">
              {copiedBookingCode ? <Check className="h-4 w-4 text-[#4ADE80]" /> : <Copy className="h-4 w-4" />}
              {copiedBookingCode ? "Copied" : "Copy booking code"}
            </button>
            <p className="mt-3 text-[12px] text-[#71717A]">Show this code at the counter when you arrive.</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
            {[
              { label: "Date", value: formatDateLabel(selectedDate) },
              { label: "Time", value: selectedSlot.label },
              { label: "Session", value: selectedSessionType.name },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA]">{item.label}</div>
                <div className="mt-1 text-[15px] font-semibold text-[#FAFAFA]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 w-full rounded-lg border border-[rgba(255,58,58,0.2)] bg-[rgba(255,58,58,0.08)] px-5 py-4 text-left">
            <div className="flex items-center gap-2 text-[14px] text-[#FAFAFA]">
              <Sparkles className="h-4 w-4 text-[#A855F7]" />
              +{bookingCoinAmount} H Coins added to your account!
            </div>
          </div>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => router.push("/profile")} className="rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-6 py-3 text-[14px] font-semibold text-white transition duration-200 hover:shadow-lg hover:shadow-[#A855F7]/50">
              View My Bookings
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingResult(null);
                setSelectedSlotId(null);
                setStep(1);
              }}
              className="rounded-lg border border-[#27272A] px-6 py-3 text-[14px] font-semibold text-[#A1A1AA] transition-colors hover:border-[#A855F7] hover:text-[#FAFAFA]"
            >
              Book Another Slot
            </button>
          </div>
        </section>
      </main>
    );
  }

  const totalPrice = selectedSessionType?.price_per_hour ?? 0;

  return (
    <main className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      <Navbar />

      <section className="mx-auto max-w-180 px-6 py-12 md:py-16">
        <div className="mb-8">
          <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#A855F7]">BOOK YOUR SESSION</div>
          <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#FAFAFA]">CHOOSE YOUR SLOT</h1>
        </div>

        <div className="mb-8 flex items-center justify-between gap-2">
          {[
            { stepNumber: 1, label: "Date & Type" },
            { stepNumber: 2, label: "Time Slot" },
            { stepNumber: 3, label: "Confirm" },
          ].map((item, index, array) => {
            const isComplete = currentStepNumber > item.stepNumber;
            const isActive = step === item.stepNumber;
            return (
              <div key={item.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-semibold ${
                      isComplete || isActive
                        ? "bg-[#8B5CF6] text-[#0A0A0A]"
                        : "border border-[#27272A] bg-[#18181B] text-[#A1A1AA]"
                    } ${isActive ? "glow-purple" : ""}`}
                  >
                    {isComplete && !isActive ? <Check className="h-3.5 w-3.5" /> : item.stepNumber}
                  </div>
                  <div className={`mt-2 text-[12px] ${isActive ? "text-[#FAFAFA]" : "text-[#A1A1AA]"}`}>{item.label}</div>
                </div>
                {index < array.length - 1 ? (
                  <div className={`mx-2 h-px flex-1 ${currentStepNumber > item.stepNumber ? "bg-[#8B5CF6]" : "bg-[#27272A]"}`} />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-8">
          {step === 1 ? (
            <div>
              <div>
                <label className="text-[13px] font-medium text-[#FAFAFA]">Select Date</label>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {dates.map((date) => {
                    const isPast = false;
                    const isSelected = selectedDate === date.value;
                    return (
                      <button
                        key={date.value}
                        type="button"
                        disabled={isPast}
                        onClick={() => setSelectedDate(date.value)}
                        className={`min-w-23 rounded-lg border p-3 text-center transition-all duration-150 ${
                          isSelected
                            ? "border-[#8B5CF6] bg-[#27272A] glow-purple"
                            : "border-[#27272A] bg-[#0A0A0A] hover:border-[#06B6D4]"
                        } ${isPast ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        <div className="text-[11px] font-medium uppercase text-[#A1A1AA]">{date.dayName}</div>
                        <div className="mt-1 text-[22px] font-semibold text-[#FAFAFA]">{date.dayNumber}</div>
                        <div className="mt-1 text-[11px] text-[#A1A1AA]">{date.month}</div>
                        {date.isToday ? <div className="mx-auto mt-2 h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" /> : <div className="mt-2 h-1.5" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[13px] text-[#A1A1AA]">Showing next 14 days. Contact us for further dates.</p>
              </div>

              <div className="mt-8">
                <label className="text-[13px] font-medium text-[#FAFAFA]">Session Type</label>
                {loadedSessionTypes.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-5 py-4 text-[13px] text-[#EF4444]">
                    Session types are not loaded from Supabase yet. Run the SQL setup in database/slot_booking_flow.sql, then refresh this page.
                  </div>
                ) : null}
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {loadedSessionTypes.map((sessionType) => {
                    const isSelected = selectedSessionTypeId === sessionType.id;
                    const isPopular = sessionType.name === "Duo";
                    return (
                      <button
                        key={sessionType.id}
                        type="button"
                        onClick={() => setSelectedSessionTypeId(sessionType.id)}
                        className={`relative rounded-xl border p-5 text-left transition-all duration-150 ${
                          isSelected ? "border-[#8B5CF6] bg-[#27272A] glow-purple" : "border-[#27272A] bg-[#0A0A0A] hover:border-[#06B6D4]"
                        }`}
                      >
                        {isPopular ? (
                          <span className="absolute right-3 top-3 rounded bg-[#8B5CF6] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#0A0A0A]">Popular</span>
                        ) : null}
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-[16px] font-semibold text-[#FAFAFA]">{sessionType.name}</div>
                          <div className="font-heading text-[24px] uppercase text-[#A855F7]">₹{sessionType.price_per_hour}/hr</div>
                        </div>
                        <div className="mt-3 text-[13px] text-[#A1A1AA]">{sessionType.description}</div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[12px] text-[#71717A]">Max {sessionType.max_players} player(s)</div>
                            <div className="mt-3 flex items-center gap-1">
                              {Array.from({ length: 4 }).map((_, index) => (
                                <User key={index} className={`h-3.5 w-3.5 ${index < sessionType.max_players ? "text-[#8B5CF6]" : "text-[#A1A1AA]"}`} />
                              ))}
                            </div>
                          </div>
                          <div className="rounded-full border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-3 py-1 text-[12px] font-medium text-[#4ADE80]">
                            +{sessionType.h_coins_earned ?? 10} H Coins
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!selectedDate || !selectedSessionTypeId}
                  onClick={() => setStep(2)}
                  className="mt-8 w-full rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-6 py-3 text-[16px] font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue to Time Slots →
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-medium text-[#FAFAFA]">Select Time Slot</div>
                  <div className="mt-1 text-[13px] text-[#A1A1AA]">{formatDateLabel(selectedDate)} · {selectedSessionType?.name}</div>
                </div>
                <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-[#27272A] px-4 py-2 text-[14px] text-[#A1A1AA] transition-colors hover:border-[#A855F7] hover:text-[#FAFAFA]">
                  ← Back
                </button>
              </div>

              {availabilityLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-xl border border-[#27272A] bg-[#18181B]" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {availableSlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      label={slot.label}
                      state={slot.state}
                      onSelect={() => {
                        if (slot.state === "available" || slot.state === "selected") {
                          setSelectedSlotId(slot.id);
                          setAvailableSlots((current) => current.map((item) => ({ ...item, state: item.id === slot.id ? "selected" : item.state === "selected" ? "available" : item.state })));
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {selectedSlot ? (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#27272A] bg-[#18181B] px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-[14px] text-[#A1A1AA]">
                    Selected: <span className="font-semibold text-[#FAFAFA]">{selectedSlot.label}</span>
                  </div>
                  <div className="text-[14px] text-[#A1A1AA]">
                    Total: <span className="font-heading text-[24px] uppercase text-[#A855F7]">₹{totalPrice}</span>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-[13px] text-[#EF4444]">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-[#27272A] px-5 py-2.5 text-[14px] text-[#A1A1AA] transition-colors hover:border-[#A855F7] hover:text-[#FAFAFA]">
                  ← Back
                </button>
                <button type="button" disabled={!selectedSlotId} onClick={() => setStep(3)} className="rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-5 py-2.5 text-[14px] font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40">
                  Confirm Details →
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <div className="text-[18px] font-semibold text-[#FAFAFA]">Review your booking</div>

              <div className="mt-6 rounded-xl border border-[#27272A] bg-[#18181B] p-6">
                <div className="flex items-center justify-between border-b border-[#27272A] py-3">
                  <div className="text-[14px] text-[#A1A1AA]">Date</div>
                  <div className="text-[15px] font-semibold text-[#FAFAFA]">{formatDateLabel(selectedDate)}</div>
                </div>
                <div className="flex items-center justify-between border-b border-[#27272A] py-3">
                  <div className="text-[14px] text-[#A1A1AA]">Time</div>
                  <div className="text-[15px] font-semibold text-[#FAFAFA]">{selectedSlot?.label}</div>
                </div>
                <div className="flex items-center justify-between border-b border-[#27272A] py-3">
                  <div className="text-[14px] text-[#A1A1AA]">Session</div>
                  <div className="text-[15px] font-semibold text-[#FAFAFA]">{selectedSessionType?.name} Session</div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="text-[14px] text-[#A1A1AA]">Players</div>
                  <div className="text-[15px] font-semibold text-[#FAFAFA]">{selectedSessionType?.max_players}</div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="text-[16px] font-semibold text-[#FAFAFA]">Total</div>
                  <div className="font-heading text-[28px] uppercase text-[#A855F7]">₹{totalPrice}</div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-[rgba(255,58,58,0.2)] bg-[rgba(255,58,58,0.08)] px-4 py-3 text-[13px] text-[#A1A1AA] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#A855F7]" />
                You&apos;ll earn {bookingCoinAmount} H Coins for this booking.
              </div>

              <div className="mt-4 text-[13px] text-[#A1A1AA]">
                Booking under H-ID: <span className="font-mono text-[14px] text-[#A855F7]">{profile?.h_id || 'N/A'}</span>
              </div>

              <div className="mt-4 text-[12px] text-[#71717A]">
                By confirming, you agree to arrive on time. No-shows forfeit the slot. Cancellations must be 2 hours before.
              </div>

              {error ? (
                <div className="mt-4 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-[13px] text-[#EF4444]">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-[#27272A] px-5 py-2.5 text-[14px] text-[#A1A1AA] transition-colors hover:border-[#A855F7] hover:text-[#FAFAFA]">
                  ← Change Slot
                </button>
                <button type="button" onClick={confirmBooking} disabled={!selectedSlotId || loadingConfirm} className="rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-5 py-2.5 text-[14px] font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40">
                  {loadingConfirm ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</span> : "Confirm Booking"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* WhatsApp Support Section */}
      <section className="mx-auto max-w-180 px-6 py-8 md:py-12">
        <div className="max-w-3xl">
          <p className="text-sm text-[#A1A1AA] mb-3">Need help choosing a slot?</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210"}?text=${encodeURIComponent("Hi Hideout Team, I need help booking a slot")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#25D366] hover:underline text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with us on WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
