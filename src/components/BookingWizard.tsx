"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, ArrowLeft, Calendar, Clock, Users, Gift, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import SetupCard, { Setup } from "@/components/SetupCard";
import SlotCard from "@/components/SlotCard";
import GamingLoader from "@/components/GamingLoader";
import { calculateBookingPrice } from "@/lib/pricing";
import { createISTDateRange } from "@/lib/istTime";

interface SessionType {
  id: string;
  name: string;
  max_players: number;
  h_coins_earned: number;
  price_multiplier?: number | string | null;
  sort_order?: number;
}

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  state: "available" | "selected" | "booked" | "past";
}

interface BookingWizardProps {
  setups: Setup[];
  sessionTypes: SessionType[];
  user: { id: string; email: string };
  profile: { h_id: string; display_name: string | null; email?: string | null } | null;
}

function formatDateLabel(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
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

function isSlotPast(date: string, startTime: string) {
  return new Date(`${date}T${startTime}`) < new Date();
}

export default function BookingWizard({ setups, sessionTypes, user, profile }: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "confirmed">(1);
  const [selectedSetup, setSelectedSetup] = useState<Setup | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [copiedBookingCode, setCopiedBookingCode] = useState(false);

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return {
        value: toLocalDateString(date),
        dayName: date.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
        isToday: index === 0,
      };
    });
  }, []);

  const eligibleSessionTypes = useMemo(() => {
    if (!selectedSetup) return [];
    return sessionTypes.filter((sessionType) => sessionType.max_players <= selectedSetup.max_players);
  }, [selectedSetup, sessionTypes]);

  const totalPrice = useMemo(() => {
    if (!selectedSetup || !selectedSessionType) return 0;
    return calculateBookingPrice(selectedSetup, selectedSessionType);
  }, [selectedSetup, selectedSessionType]);

  useEffect(() => {
    if (step === 3 && !selectedDate && dates.length > 0) {
      setSelectedDate(dates[0].value);
    }
  }, [dates, selectedDate, step]);

  useEffect(() => {
    if (step !== 3 || !selectedSetup || !selectedDate) return;

    let isActive = true;

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setError(null);

      const { data: slotsData, error: slotsError } = await supabase
        .from("time_slots")
        .select("id, label, start_time, end_time, sort_order")
        .order("sort_order", { ascending: true });

      if (slotsError) {
        if (isActive) {
          setError(slotsError.message);
          setAvailabilityLoading(false);
        }
        return;
      }

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("time_slot_id")
        .eq("booking_date", selectedDate)
        .eq("setup_id", selectedSetup.id);

      if (bookingsError) {
        if (isActive) {
          setError(bookingsError.message);
          setAvailabilityLoading(false);
        }
        return;
      }

      const bookedIds = new Set((bookingsData ?? []).map((booking: { time_slot_id: string }) => booking.time_slot_id));
      const nextSlots: TimeSlot[] = (slotsData ?? []).map((slot) => {
        const state: TimeSlot["state"] = bookedIds.has(slot.id)
          ? "booked"
          : isSlotPast(selectedDate, slot.start_time)
            ? "past"
            : selectedSlot?.id === slot.id
              ? "selected"
              : "available";

        return { ...slot, state };
      });

      if (isActive) {
        setAvailableSlots(nextSlots);
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();

    return () => {
      isActive = false;
    };
  }, [selectedDate, selectedSetup, selectedSlot, step]);

  useEffect(() => {
    if (!selectedSlot) return;
    const match = availableSlots.find((slot) => slot.id === selectedSlot.id);
    if (match && match.state !== "available" && match.state !== "selected") {
      setSelectedSlot(null);
    }
  }, [availableSlots, selectedSlot]);

  const confirmBooking = async () => {
    if (!selectedSetup || !selectedSessionType || !selectedSlot || !selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      const { start, end } = createISTDateRange(selectedDate, selectedSlot.start_time, selectedSlot.end_time);

      let calendarEventId = "";

      try {
        const calendarResponse = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createCalendarEvent",
            data: {
              summary: `Hideout Booking - ${profile?.display_name || user.email}`,
              description: [
                `Setup: ${selectedSetup.display_name}`,
                `Session: ${selectedSessionType.name}`,
                `Players: ${selectedSessionType.max_players}`,
                `Price: Rs. ${totalPrice}`,
                `H-ID: ${profile?.h_id || "N/A"}`,
                `Email: ${user.email}`,
              ].join("\n"),
              startTime: start,
              endTime: end,
            },
          }),
        });

        const calendarJson = await calendarResponse.json();
        if (calendarResponse.ok && calendarJson?.eventId) {
          calendarEventId = calendarJson.eventId;
        }
      } catch (calendarError) {
        console.error("Calendar event creation failed", calendarError);
      }

      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup_id: selectedSetup.id,
          session_type_id: selectedSessionType.id,
          time_slot_id: selectedSlot.id,
          booking_date: selectedDate,
          calendar_event_id: calendarEventId,
        }),
      });

      const bookingJson = await bookingResponse.json();
      if (!bookingResponse.ok || !bookingJson?.booking) {
        setError(bookingJson?.error || "Failed to save booking.");
        return;
      }

      setBookingResult(bookingJson.booking);
      setStep("confirmed");
    } catch (bookingError) {
      console.error("Booking failed", bookingError);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyBookingCode = async () => {
    if (!bookingResult?.booking_code) return;
    await navigator.clipboard.writeText(bookingResult.booking_code);
    setCopiedBookingCode(true);
    window.setTimeout(() => setCopiedBookingCode(false), 2000);
  };

  const steps = [
    { stepNumber: 1, label: "Choose Setup" },
    { stepNumber: 2, label: "Choose Session" },
    { stepNumber: 3, label: "Date & Time" },
    { stepNumber: 4, label: "Confirm" },
  ];

  const currentStepNumber = step === "confirmed" ? 4 : step;

  if (step === "confirmed" && bookingResult && selectedSetup && selectedSessionType && selectedSlot) {
    return (
      <main className="min-h-screen bg-[#0A0F18] text-[#F5F1EA]">
        <Navbar />
        <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4500] to-[#22C55E]">
            <Check className="h-12 w-12 text-white" />
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-[#FF4500] to-[#22C55E] bg-clip-text font-heading text-5xl uppercase text-transparent">
            YOU&apos;RE IN
          </h1>
          <p className="mb-8 text-[#A0A6AF]">Your slot is locked in. See you at The Hideout!</p>

          <div className="mb-8 w-full rounded-2xl border border-[#FF4500]/30 bg-[#14181F] p-8">
            <div className="mb-2 text-sm font-medium uppercase tracking-wider text-[#FF4500]">BOOKING CODE</div>
            <div className="mb-4 font-mono text-4xl font-bold tracking-wider text-[#FF4500] md:text-5xl">
              {bookingResult.booking_code}
            </div>
            <button
              type="button"
              onClick={copyBookingCode}
              className="inline-flex items-center gap-2 text-[#A0A6AF] transition-colors hover:text-[#FF4500]"
            >
              {copiedBookingCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copiedBookingCode ? "Copied!" : "Copy booking code"}
            </button>
          </div>

          <div className="mb-8 grid w-full grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[#2A2F38] bg-[#14181F] p-4 text-center">
              <Calendar className="mx-auto mb-2 h-5 w-5 text-[#FF4500]" />
              <div className="text-xs text-[#A0A6AF]">Date</div>
              <div className="text-sm font-semibold text-white">{formatDateLabel(selectedDate)}</div>
            </div>
            <div className="rounded-xl border border-[#2A2F38] bg-[#14181F] p-4 text-center">
              <Clock className="mx-auto mb-2 h-5 w-5 text-[#22C55E]" />
              <div className="text-xs text-[#A0A6AF]">Time</div>
              <div className="text-sm font-semibold text-white">{selectedSlot.label}</div>
            </div>
            <div className="rounded-xl border border-[#2A2F38] bg-[#14181F] p-4 text-center">
              <Users className="mx-auto mb-2 h-5 w-5 text-[#FF5722]" />
              <div className="text-xs text-[#A0A6AF]">Setup</div>
              <div className="text-sm font-semibold text-white">{selectedSetup.display_name}</div>
            </div>
            <div className="rounded-xl border border-[#2A2F38] bg-[#14181F] p-4 text-center">
              <Gift className="mx-auto mb-2 h-5 w-5 text-green-500" />
              <div className="text-xs text-[#A0A6AF]">H Coins</div>
              <div className="text-sm font-semibold text-green-500">+{selectedSessionType.h_coins_earned}</div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="rounded-xl bg-gradient-to-r from-[#FF4500] to-[#CC3700] px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
            >
              View My Bookings
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingResult(null);
                setSelectedSetup(null);
                setSelectedSessionType(null);
                setSelectedSlot(null);
                setSelectedDate("");
                setStep(1);
              }}
              className="rounded-xl border border-[#22C55E] px-6 py-3 font-semibold text-[#22C55E] transition-all hover:bg-[#22C55E]/10"
            >
              Book Another Slot
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0F18] text-[#F5F1EA]">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8">
          <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF4500]">BOOK YOUR SESSION</div>
          <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#F5F1EA]">CHOOSE YOUR SLOT</h1>
        </div>

        <div className="mb-8 flex items-center justify-between gap-2">
          {steps.map((item, index) => {
            const isComplete = currentStepNumber > item.stepNumber;
            const isActive = step === item.stepNumber;

            return (
              <div key={item.stepNumber} className="flex flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-semibold ${
                      isComplete || isActive
                        ? "bg-[#FF4500] text-white"
                        : "border border-[#2A2F38] bg-[#14181F] text-[#A0A6AF]"
                    } ${isActive ? "glow-box" : ""}`}
                  >
                    {isComplete && !isActive ? <Check className="h-3.5 w-3.5" /> : item.stepNumber}
                  </div>
                  <div className={`mt-2 text-[12px] ${isActive ? "text-[#F5F1EA]" : "text-[#A0A6AF]"}`}>{item.label}</div>
                </div>

                {index < steps.length - 1 ? (
                  <div className={`mx-2 h-px flex-1 ${currentStepNumber > item.stepNumber ? "bg-[#FF4500]" : "bg-[#2A2F38]"}`} />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-[#2A2F38] bg-[#14181F] p-6 md:p-8">
          {step === 1 ? (
            <div>
              <h2 className="text-xl font-bold text-white">Choose your gaming setup</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {setups.map((setup) => (
                  <SetupCard
                    key={setup.id}
                    setup={setup}
                    isSelected={selectedSetup?.id === setup.id}
                    onSelect={() => {
                      setSelectedSetup(setup);
                      setSelectedSessionType(null);
                      setSelectedSlot(null);
                      setSelectedDate("");
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                disabled={!selectedSetup}
                onClick={() => setStep(2)}
                className="mt-8 w-full rounded-lg bg-gradient-to-r from-[#FF4500] to-[#CC3700] px-6 py-3 text-[16px] font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-105"
              >
                Continue
              </button>
            </div>
          ) : null}

          {step === 2 && selectedSetup ? (
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Choose session type</h2>
                  <p className="mt-1 text-sm text-[#A0A6AF]">{selectedSetup.display_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-[#A0A6AF] transition-colors hover:text-[#FF4500]"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {eligibleSessionTypes.map((sessionType) => {
                  const isSelected = selectedSessionType?.id === sessionType.id;
                  const price = calculateBookingPrice(selectedSetup, sessionType);

                  return (
                    <button
                      key={sessionType.id}
                      type="button"
                      onClick={() => {
                        setSelectedSessionType(sessionType);
                        setSelectedSlot(null);
                      }}
                      className={`rounded-xl border p-5 text-left transition-all duration-150 ${
                        isSelected
                          ? "border-2 border-[#FF4500] bg-[#1F242C] glow-box"
                          : "border-[#2A2F38] bg-[#0A0F18] hover:border-[#FF4500]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[18px] font-semibold text-[#F5F1EA]">{sessionType.name}</div>
                        <div className="font-heading text-[26px] uppercase text-[#FF4500]">Rs. {price}</div>
                      </div>
                      <div className="mt-3 text-[13px] text-[#A0A6AF]">Up to {sessionType.max_players} players</div>
                      <div className="mt-2 text-[12px] text-[#22C55E]">+{sessionType.h_coins_earned} H Coins</div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedSessionType}
                onClick={() => setStep(3)}
                className="mt-8 w-full rounded-lg bg-gradient-to-r from-[#FF4500] to-[#CC3700] px-6 py-3 text-[16px] font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-105"
              >
                Continue
              </button>
            </div>
          ) : null}

          {step === 3 && selectedSetup && selectedSessionType ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Select date and time</h2>
                  <p className="mt-1 text-sm text-[#A0A6AF]">
                    {selectedSetup.display_name} / {selectedSessionType.name} / Rs. {totalPrice}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-[#A0A6AF] transition-colors hover:text-[#FF4500]"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#F5F1EA]">Select Date</label>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {dates.map((date) => {
                    const isSelected = selectedDate === date.value;
                    return (
                      <button
                        key={date.value}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date.value);
                          setSelectedSlot(null);
                        }}
                        className={`min-w-23 rounded-lg border p-3 text-center transition-all duration-150 ${
                          isSelected
                            ? "border-[#FF4500] bg-[#2A2F38] glow-box"
                            : "border-[#2A2F38] bg-[#0A0F18] hover:border-[#FF4500]"
                        }`}
                      >
                        <div className="text-[11px] font-medium uppercase text-[#A0A6AF]">{date.dayName}</div>
                        <div className="mt-1 text-[22px] font-semibold text-[#F5F1EA]">{date.dayNumber}</div>
                        <div className="mt-1 text-[11px] text-[#A0A6AF]">{date.month}</div>
                        {date.isToday ? <div className="mx-auto mt-2 h-1.5 w-1.5 rounded-full bg-[#FF4500]" /> : <div className="mt-2 h-1.5" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[13px] text-[#A0A6AF]">Showing next 14 days. Contact us for further dates.</p>
              </div>

              {availabilityLoading ? (
                <div className="py-8">
                  <GamingLoader />
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-xl border border-[#2A2F38] bg-[#14181F]" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {availableSlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      label={slot.label}
                      state={slot.state}
                      onSelect={() => {
                        if (slot.state === "available") {
                          setSelectedSlot(slot);
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {selectedSlot ? (
                <div className="flex flex-col gap-3 rounded-xl border border-[#2A2F38] bg-[#14181F] px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-[#A0A6AF]">
                    Selected: <span className="font-semibold text-[#FF4500]">{selectedSlot.label}</span>
                  </div>
                  <div className="text-[#A0A6AF]">
                    Total: <span className="font-heading text-2xl uppercase text-[#FF4500]">Rs. {totalPrice}</span>
                  </div>
                </div>
              ) : null}

              {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div> : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-lg border border-[#2A2F38] px-5 py-2.5 text-[#A0A6AF] transition-colors hover:border-[#FF4500] hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot || loading}
                  onClick={() => setStep(4)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-[#FF4500] to-[#CC3700] px-5 py-2.5 font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-105"
                >
                  Review Booking
                </button>
              </div>
            </div>
          ) : null}

          {step === 4 && selectedSetup && selectedSessionType && selectedSlot && selectedDate ? (
            <div>
              <h2 className="text-xl font-bold text-white">Review your booking</h2>

              <div className="mt-6 rounded-xl border border-[#2A2F38] bg-[#14181F] p-6">
                <div className="flex items-center justify-between border-b border-[#2A2F38] py-3">
                  <div className="text-[14px] text-[#A0A6AF]">Setup</div>
                  <div className="text-right text-[15px] font-semibold text-[#F5F1EA]">{selectedSetup.display_name}</div>
                </div>
                <div className="flex items-center justify-between border-b border-[#2A2F38] py-3">
                  <div className="text-[14px] text-[#A0A6AF]">Session</div>
                  <div className="text-right text-[15px] font-semibold text-[#F5F1EA]">
                    {selectedSessionType.name} ({selectedSessionType.max_players} players)
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-[#2A2F38] py-3">
                  <div className="text-[14px] text-[#A0A6AF]">Date</div>
                  <div className="text-right text-[15px] font-semibold text-[#F5F1EA]">{formatDateLabel(selectedDate)}</div>
                </div>
                <div className="flex items-center justify-between border-b border-[#2A2F38] py-3">
                  <div className="text-[14px] text-[#A0A6AF]">Time</div>
                  <div className="text-right text-[15px] font-semibold text-[#F5F1EA]">{selectedSlot.label}</div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="text-[16px] font-semibold text-[#F5F1EA]">Total</div>
                  <div className="font-heading text-[28px] uppercase text-[#FF4500]">Rs. {totalPrice}</div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-[#FF4500]/20 bg-[#FF4500]/10 px-4 py-3 text-[13px] text-[#A0A6AF]">
                <Sparkles className="mr-2 inline-block h-4 w-4 text-[#FF4500]" />
                You&apos;ll earn {selectedSessionType.h_coins_earned} H Coins for this booking.
              </div>

              {error ? <div className="mt-4 rounded-lg border border-[#FF4500]/30 bg-[#FF4500]/10 px-4 py-3 text-[13px] text-[#FF4500]">{error}</div> : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-[#2A2F38] px-5 py-2.5 text-[14px] text-[#A0A6AF] transition-colors hover:border-[#FF4500] hover:text-[#F5F1EA]"
                >
                  Change Slot
                </button>
                <button
                  type="button"
                  onClick={confirmBooking}
                  disabled={loading}
                  className="rounded-lg bg-gradient-to-r from-[#FF4500] to-[#CC3700] px-5 py-2.5 text-[14px] font-semibold text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-105"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
                    </span>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}