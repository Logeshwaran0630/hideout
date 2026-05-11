'use client';

import Navbar from "@/components/Navbar";
import SlotCard from "@/components/SlotCard";
import { supabase } from "@/lib/supabase/client";
import { createISTDateRange, debugTimeConversion } from "@/lib/istTime";
import { Check, CheckCircle2, Copy, Loader2, Sparkles, User, ArrowLeft } from "lucide-react";
import GamingLoader from "@/components/GamingLoader";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SessionType = {
  id: string;
  name: string;
  max_players: number;
  price_per_hour: number;
  description: string | null;
};

type Profile = {
  h_id: string;
  display_name: string | null;
  email: string | null;
};

type BookingResult = {
  booking_code: string;
  booking_date: string;
  total_price: number;
  session_type_id: string;
  time_slot_id: string;
  id: string;
};

type SlotRecord = {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  sort_order: number;
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
  const slotDateTime = new Date(`${date}T${startTime}`);
  return slotDateTime < now;
}

export default function BookingWizard({ sessionTypes, user, profile }: BookingWizardProps) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [step, setStep] = useState<1 | 2 | 3 | "confirmed">(1);
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(new Date()));
  const [selectedSessionTypeId, setSelectedSessionTypeId] = useState(sessionTypes[0]?.id ?? "");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<SlotRecord[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [copiedBookingCode, setCopiedBookingCode] = useState(false);

  const selectedSessionType = sessionTypes.find((item) => item.id === selectedSessionTypeId) ?? sessionTypes[0] ?? null;
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
    if (!selectedSessionTypeId && sessionTypes[0]) {
      setSelectedSessionTypeId(sessionTypes[0].id);
    }
  }, [selectedSessionTypeId, sessionTypes]);

  useEffect(() => {
    if (step !== 2) return;

    let cancelled = false;

    async function fetchAvailability() {
      setAvailabilityLoading(true);
      setError(null);

      // Get all time slots from Supabase (for reference only)
      const { data: allSlots } = await supabase
        .from("time_slots")
        .select("*")
        .order("sort_order");

      if (cancelled) return;

      if (!allSlots) {
        setAvailabilityLoading(false);
        return;
      }

      // Prepare slots for Google Calendar check
      const slotsToCheck = allSlots.map((slot: any) => {
        const { start, end } = createISTDateRange(selectedDate, slot.start_time, slot.end_time);
        
        console.log(`[Booking] Slot ${slot.label}:`, {
          local: `${selectedDate} ${slot.start_time} - ${slot.end_time} (IST)`,
          utc: `${start} - ${end}`,
          debug: debugTimeConversion(selectedDate, slot.start_time),
        });
        
        return {
          slotId: slot.id,
          start: start,
          end: end,
        };
      });

      // PRIMARY SOURCE OF TRUTH: Check Google Calendar
      const availabilityMap = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkMultipleSlotsAvailability',
          slots: slotsToCheck,
        }),
      })
        .then((res) => res.json())
        .catch((err) => {
          console.error('Error checking calendar availability:', err);
          return { success: false, availability: {} };
        });

      if (cancelled) return;

      if (!availabilityMap.success) {
        setError("Couldn't load slot availability. Please try again.");
        setAvailabilityLoading(false);
        return;
      }

      setAvailableSlots(
        allSlots.map((slot: any) => {
          const isBooked = !availabilityMap.availability[slot.id];
          return {
            ...slot,
            state: isBooked
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
    }

    fetchAvailability().catch(() => {
      if (!cancelled) {
        setAvailabilityLoading(false);
        setError("Couldn't load slot availability. Please try again.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [step, selectedDate, selectedSlotId]);

  async function confirmBooking() {
    if (!selectedSlot || !selectedSessionType) return;

    setLoadingConfirm(true);
    setError(null);

    // Get proper IST conversion for calendar event
    const { start: startTimeIST, end: endTimeIST } = createISTDateRange(
      selectedDate,
      selectedSlot.start_time,
      selectedSlot.end_time
    );

    console.log('[Booking Confirmation]', {
      date: selectedDate,
      slot: `${selectedSlot.start_time} - ${selectedSlot.end_time}`,
      startIST: startTimeIST,
      endIST: endTimeIST,
    });

    // STEP 1: Check availability in Google Calendar AGAIN (prevent race condition)
    const availabilityCheck = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkSlotAvailability',
        data: {
          startDateTime: startTimeIST,
          endDateTime: endTimeIST,
        },
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.error('Error checking calendar availability:', err);
        return { success: false, available: false };
      });

    if (!availabilityCheck.available) {
      setError("This slot was just booked. Please choose another time.");
      setLoadingConfirm(false);
      return;
    }

    // STEP 2: Create event in Google Calendar (SOURCE OF TRUTH)
    const eventResponse = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createCalendarEvent',
        data: {
          summary: `Hideout Booking - ${profile?.display_name || user.email} (${profile?.h_id})`,
          description: `
Booking Details:
- Session Type: ${selectedSessionType.name}
- Players: ${selectedSessionType.max_players}
- Price: ₹${selectedSessionType.price_per_hour}
- H-ID: ${profile?.h_id}
- Email: ${user.email}
          `.trim(),
          startTime: startTimeIST,
          endTime: endTimeIST,
        },
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.error('Error creating calendar event:', err);
        return { success: false, eventId: null };
      });

    if (!eventResponse.success || !eventResponse.eventId) {
      setError("Failed to create calendar event. Please try again.");
      setLoadingConfirm(false);
      return;
    }

    const calendarEventId = eventResponse.eventId;

    // STEP 3: Save booking through the API so server-side emails are sent.
    const bookingResponse = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        time_slot_id: selectedSlot.id,
        session_type_id: selectedSessionType.id,
        booking_date: selectedDate,
        calendar_event_id: calendarEventId,
      }),
    })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .catch((err) => {
        console.error("Error saving booking:", err);
        return { ok: false, json: { error: "Booking failed" } };
      });

    if (!bookingResponse.ok || !bookingResponse.json?.booking) {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancelCalendarEvent',
          data: { eventId: calendarEventId },
        }),
      }).catch((err) => console.error('Error rolling back calendar event:', err));

      setError(bookingResponse.json?.error || "Failed to save booking. Please try again.");
      setLoadingConfirm(false);
      return;
    }

    setBookingResult(bookingResponse.json.booking as BookingResult);
    setLoadingConfirm(false);
    setStep("confirmed");
  }

  async function copyBookingCode() {
    if (!bookingResult?.booking_code) return;
    await navigator.clipboard.writeText(bookingResult.booking_code);
    setCopiedBookingCode(true);
    setTimeout(() => setCopiedBookingCode(false), 2000);
  }

  const bookingCoinAmount = selectedSessionType?.name === "Duo" ? 15 : selectedSessionType?.name === "Squad" ? 25 : 10;
  const currentStepNumber = step === "confirmed" ? 3 : step;

  if (step === "confirmed" && bookingResult && selectedSlot && selectedSessionType) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
        <Navbar />
        <div className="min-h-screen bg-[#0A0A0A] py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Animation - Purple theme */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#A855F7] to-[#06B6D4] flex items-center justify-center mx-auto mb-8 animate-pulse-glow">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-5xl font-black uppercase mb-4 bg-gradient-to-r from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">
              YOU'RE IN! 🎉
            </h1>
            <p className="text-[#A1A1AA] mb-8">Your slot is locked in. See you at The Hideout!</p>

            {/* Booking Code Card - Purple theme */}
            <div className="bg-[#18181B] border border-[#A855F7]/30 rounded-2xl p-8 mb-8 shadow-lg shadow-[#A855F7]/10">
              <div className="text-[#A855F7] text-sm font-medium uppercase tracking-wider mb-2">BOOKING CODE</div>
              <div className="text-4xl md:text-5xl font-mono font-bold text-[#A855F7] tracking-wider mb-4 glow-text-purple">
                {bookingResult.booking_code}
              </div>
              <button
                onClick={copyBookingCode}
                className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
              >
                {copiedBookingCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiedBookingCode ? "Copied!" : "Copy booking code"}
              </button>
              <p className="text-xs text-[#A1A1AA] mt-3">Show this code at the counter when you arrive.</p>
            </div>

            {/* Booking Details Grid - Updated colors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Date", value: formatDateLabel(selectedDate), color: "#A855F7" },
                { label: "Time", value: selectedSlot.label, color: "#06B6D4" },
                { label: "Session", value: selectedSessionType.name, color: "#EC4899" },
                { label: "H Coins Earned", value: `+${bookingCoinAmount}`, color: "#22C55E" },
              ].map((item) => (
                <div key={item.label} className="bg-[#18181B] border border-[#2A2A2A] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#A1A1AA] uppercase tracking-wider">{item.label}</div>
                  <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/profile")}
                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white hover:scale-105 transition-transform"
              >
                View My Bookings
              </button>
              <button
                onClick={() => {
                  setBookingResult(null);
                  setSelectedSlotId(null);
                  setStep(1);
                }}
                className="px-6 py-3 rounded-xl font-semibold border border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-all"
              >
                Book Another Slot
              </button>
            </div>
          </div>
        </div>
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
                        ? "bg-[#8B5CF6] text-[#09090B]"
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
                            : "border-[#27272A] bg-[#09090B] hover:border-[#06B6D4]"
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
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {sessionTypes.map((sessionType) => {
                    const isSelected = selectedSessionTypeId === sessionType.id;
                    const isPopular = sessionType.name === "Duo";
                    return (
                      <button
                        key={sessionType.id}
                        type="button"
                        onClick={() => setSelectedSessionTypeId(sessionType.id)}
                        className={`relative rounded-xl border p-5 text-left transition-all duration-150 ${
                          isSelected ? "border-[#8B5CF6] bg-[#27272A] glow-purple" : "border-[#27272A] bg-[#09090B] hover:border-[#06B6D4]"
                        }`}
                      >
                        {isPopular ? (
                          <span className="absolute right-3 top-3 rounded bg-[#8B5CF6] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#09090B]">Popular</span>
                        ) : null}
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-[16px] font-semibold text-[#FAFAFA]">{sessionType.name}</div>
                          <div className="font-heading text-[24px] uppercase text-[#A855F7]">₹{sessionType.price_per_hour}/hr</div>
                        </div>
                        <div className="mt-3 text-[13px] text-[#A1A1AA]">{sessionType.description}</div>
                        <div className="mt-4 text-[12px] text-[#71717A]">Max {sessionType.max_players} player(s)</div>
                        <div className="mt-3 flex items-center gap-1">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <User key={index} className={`h-3.5 w-3.5 ${index < sessionType.max_players ? "text-[#8B5CF6]" : "text-[#A1A1AA]"}`} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!selectedDate || !selectedSessionTypeId}
                  onClick={() => setStep(2)}
                  className="mt-8 w-full rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-6 py-3 text-[16px] font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-105"
                >
                  Continue to Time Slots →
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Select Time Slot</h2>
                  <p className="text-sm text-[#A1A1AA]">{formatDateLabel(selectedDate)} · {selectedSessionType?.name}</p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-[#A1A1AA] hover:text-[#A855F7] transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>

              {/* Gaming Loader - Animated Joystick with Tips */}
              {availabilityLoading && (
                <div className="py-8">
                  <GamingLoader />
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-[#18181B] border border-[#2A2A2A] rounded-xl p-4 h-16">
                          <div className="skeleton h-4 w-24 bg-[#2A2A2A] rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Slots Grid - Shown when loaded */}
              {!availabilityLoading && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      label={slot.label}
                      state={slot.state}
                      onSelect={() => {
                        if (slot.state === "available" || slot.state === "selected") {
                          setSelectedSlotId(slot.id);
                          setAvailableSlots((current) =>
                            current.map((item) => ({
                              ...item,
                              state: item.id === slot.id ? "selected" : item.state === "selected" ? "available" : item.state,
                            }))
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Selected slot display */}
              {selectedSlot && !availabilityLoading && (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#18181B] px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-[#A1A1AA]">
                    Selected: <span className="font-semibold text-[#A855F7]">{selectedSlot.label}</span>
                  </div>
                  <div className="text-[#A1A1AA]">
                    Total: <span className="font-heading text-2xl uppercase text-[#A855F7]">₹{totalPrice}</span>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && !availabilityLoading && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              {/* Continue Button - Only show when not loading */}
              {!availabilityLoading && (
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-lg border border-[#2A2A2A] px-5 py-2.5 text-[#A1A1AA] transition-colors hover:border-[#A855F7] hover:text-white"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSlotId}
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-5 py-2.5 font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-105"
                  >
                    Confirm Details →
                  </button>
                </div>
              )}
            </div>
          )}

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

              <div className="mt-4 rounded-lg border border-[#A855F7]/20 bg-[#1A0A1A]/5 px-4 py-3 text-[13px] text-[#A1A1AA] flex items-center gap-2">
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
                <div className="mt-4 rounded-lg border border-[#A855F7]/30 bg-[#A855F7]/10 px-4 py-3 text-[13px] text-[#A855F7]">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-[#27272A] px-5 py-2.5 text-[14px] text-[#A1A1AA] transition-colors hover:border-[#A855F7] hover:text-[#FAFAFA]">
                  ← Change Slot
                </button>
                <button type="button" onClick={confirmBooking} disabled={!selectedSlotId || loadingConfirm} className="rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] px-5 py-2.5 text-[14px] font-semibold text-[#09090B] transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-105">
                  {loadingConfirm ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</span> : "Confirm Booking"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
