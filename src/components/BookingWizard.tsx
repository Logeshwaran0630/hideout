"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, ArrowLeft, Calendar, Clock, Users, Gift, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import SetupCard, { Setup } from "@/components/SetupCard";
import SlotCard from "@/components/SlotCard";
import GamingLoader from "@/components/GamingLoader";
import { calculateBookingPrice, isRacingSessionType } from "@/lib/pricing";
import { createISTDateRange } from "@/lib/istTime";

interface SessionType {
  id: string;
  name: string;
  max_players: number;
  h_coins_earned: number;
  price_per_hour?: number;
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
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "confirmed">(1);
  const [selectedSetup, setSelectedSetup] = useState<Setup | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [bookingMode, setBookingMode] = useState<'setup' | 'allAccess'>('setup');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [allAccessPrices, setAllAccessPrices] = useState<Record<string, { price: number; coins: number }>>({});
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
    if (bookingMode === 'allAccess') {
      if (selectedDuration) {
        return sessionTypes.filter((s) => s.name === `All-Access - ${selectedDuration}`);
      }

      return sessionTypes.filter((s) => {
        if (s.name === 'All-Access - 30min') return Boolean(allAccessPrices['30min']);
        if (s.name === 'All-Access - 1hr') return Boolean(allAccessPrices['1hr']);
        return false;
      });
    }
    if (!selectedSetup) return [];
    if (selectedSetup.name === "racing") {
      return sessionTypes.filter((sessionType) => isRacingSessionType(sessionType.name));
    }

    // For non-racing setups, show only Solo/Duo/Squad
    return sessionTypes.filter((sessionType) =>
      sessionType.name === 'Solo' || sessionType.name === 'Duo' || sessionType.name === 'Squad'
    );
  }, [allAccessPrices, bookingMode, selectedDuration, selectedSetup, sessionTypes]);

  const totalPrice = useMemo(() => {
    if (!selectedSessionType) return 0;

    if (selectedSessionType.name.startsWith('All-Access')) {
      // prefer values from all_access_settings table when available
      const key = selectedSessionType.name.includes('30min') ? '30min' : '1hr';
      return allAccessPrices[key]?.price ?? selectedSessionType.price_per_hour ?? 0;
    }

    if (!selectedSetup) return 0;
    const priceKey = `${selectedSetup.id}_${selectedSessionType.name}`;
    if (typeof currentPrices[priceKey] === "number") {
      return currentPrices[priceKey];
    }
    return calculateBookingPrice(selectedSetup, selectedSessionType);
  }, [currentPrices, selectedSetup, selectedSessionType]);

  useEffect(() => {
    let isActive = true;

    const fetchPrices = async () => {
      const { data } = await supabase
        .from("price_settings")
        .select("setup_id, current_price, session_types(name)");

      if (!isActive || !data) return;

      const priceMap: Record<string, number> = {};
      for (const item of data as any[]) {
        const relation = item.session_types;
        const sessionName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
        if (!item.setup_id || !sessionName) continue;
        priceMap[`${item.setup_id}_${sessionName}`] = item.current_price;
      }

      setCurrentPrices(priceMap);
    };

    fetchPrices();

    // fetch all-access prices
    const fetchAllAccess = async () => {
      try {
        const { data } = await supabase.from('all_access_settings').select('*').eq('is_active', true);
        if (!isActive || !data) return;
        const prices: Record<string, { price: number; coins: number }> = {};
        data.forEach((r: any) => {
          if (r.duration_minutes === 30) prices['30min'] = { price: r.price, coins: r.h_coins_earned };
          if (r.duration_minutes === 60) prices['1hr'] = { price: r.price, coins: r.h_coins_earned };
        });
        setAllAccessPrices(prices);
      } catch (e) {
        // ignore
      }
    };

    fetchAllAccess();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (step === 3 && !selectedDate && dates.length > 0) {
      setSelectedDate(dates[0].value);
    }
  }, [dates, selectedDate, step]);

  useEffect(() => {
    if (step !== 3 || (!selectedSetup && bookingMode !== 'allAccess') || !selectedDate) return;

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

      let bookingsQuery = supabase.from("bookings").select("time_slot_id").eq("booking_date", selectedDate);
      if (bookingMode !== 'allAccess') {
        bookingsQuery = bookingsQuery.eq("setup_id", selectedSetup!.id);
      }
      const { data: bookingsData, error: bookingsError } = await bookingsQuery;

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
                selectedSetup.name === "racing"
                  ? `Mode: ${selectedSessionType.name}`
                  : `Players: ${selectedSessionType.max_players}`,
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
          setup_id: bookingMode === 'allAccess' ? null : selectedSetup?.id,
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
  const isRedeemedBooking = step === "confirmed" && bookingResult?.total_price === 0;

  if (step === "confirmed" && bookingResult && (selectedSetup || bookingMode === 'allAccess') && selectedSessionType && selectedSlot) {
    return (
      <main className="min-h-screen bg-[#050508] text-[#F5F1EA]">
        <Navbar />
        <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #ff5200, #22C55E)' }}>
            <Check className="h-12 w-12 text-white" />
          </div>
          <h1 className="mb-4 bg-clip-text font-orbitron text-5xl uppercase text-transparent" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, backgroundImage: 'linear-gradient(135deg, #ff5200, #22C55E)', WebkitBackgroundClip: 'text' }}>
            YOU&apos;RE IN
          </h1>
          <p className="mb-8 font-sans text-[#A0A6AF]">Your slot is locked in. See you at The Hideout!</p>

          {isRedeemedBooking ? (
            <div className="mb-6 rounded-2xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-5 py-4 text-sm font-sans text-[#22C55E]">
              This booking was redeemed with H Coins. No H Coins were earned for this session.
            </div>
          ) : null}

          <div className="mb-8 w-full rounded-2xl border border-[rgba(255,82,0,0.3)] bg-[#0A0F18] p-8" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(255,82,0,0.05)' }}>
            <div className="mb-2 text-sm font-cinzel uppercase tracking-wider text-[#ff5200]" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.15em' }}>BOOKING CODE</div>
            <div className="mb-4 text-4xl tracking-wider md:text-5xl booking-code">
              {bookingResult.booking_code}
            </div>
            <button
              type="button"
              onClick={copyBookingCode}
              className="inline-flex items-center gap-2 font-sans text-[#A0A6AF] transition-colors hover:text-[#ff5200]"
            >
              {copiedBookingCode ? <Check className="h-4 w-4 text-[#22C55E]" /> : <Copy className="h-4 w-4" />}
              {copiedBookingCode ? "Copied!" : "Copy booking code"}
            </button>
          </div>

          <div className="mb-8 grid w-full grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[#1A1F28] bg-[#0A0F18] p-4 text-center">
              <Calendar className="mx-auto mb-2 h-5 w-5 text-[#ff5200]" />
              <div className="text-xs font-sans text-[#A0A6AF]">Date</div>
              <div className="text-sm font-sans font-bold text-white">{formatDateLabel(selectedDate)}</div>
            </div>
            <div className="rounded-xl border border-[#1A1F28] bg-[#0A0F18] p-4 text-center">
              <Clock className="mx-auto mb-2 h-5 w-5 text-[#22C55E]" />
              <div className="text-xs font-sans text-[#A0A6AF]">Time</div>
              <div className="text-sm font-sans font-bold text-white">{selectedSlot.label}</div>
            </div>
            <div className="rounded-xl border border-[#1A1F28] bg-[#0A0F18] p-4 text-center">
              <Users className="mx-auto mb-2 h-5 w-5 text-[#cc2200]" />
              <div className="text-xs font-sans text-[#A0A6AF]">Setup</div>
              <div className="text-sm font-sans font-bold text-white">{selectedSetup?.display_name ?? 'All-Access Pass'}</div>
            </div>
            <div className="rounded-xl border border-[#1A1F28] bg-[#0A0F18] p-4 text-center">
              <Gift className="mx-auto mb-2 h-5 w-5 text-[#22C55E]" />
              <div className="text-xs font-sans text-[#A0A6AF]">H Coins</div>
              <div className="text-sm font-sans font-bold text-[#22C55E]">
                {isRedeemedBooking ? "0 earned" : `+${selectedSessionType.h_coins_earned}`}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="btn-primary rounded-xl px-6 py-3 font-sans font-semibold"
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
                setSelectedDuration('');
                setStep(1);
              }}
              className="btn-outline rounded-xl px-6 py-3 font-sans font-semibold"
            >
              Book Another Slot
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] text-[#F5F1EA]">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-8">
          <div className="text-[12px] font-sans font-semibold uppercase tracking-[0.15em] text-[#ff5200]">BOOK YOUR SESSION</div>
          <h1 className="mt-3 font-orbitron text-[48px] uppercase leading-none text-[#F5F1EA]" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>CHOOSE YOUR SLOT</h1>
        </div>

        <div className="mb-8 flex items-center justify-between gap-2">
          {steps.map((item, index) => {
            const isComplete = currentStepNumber > item.stepNumber;
            const isActive = step === item.stepNumber;

            return (
              <div key={item.stepNumber} className="flex flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-sans font-bold transition-all duration-300 ${
                      isActive
                        ? "text-white"
                        : isComplete
                        ? "text-[#ff5200]"
                        : "border border-[#1A1F28] bg-[#1A1F28] text-[#6B7280]"
                    }`}
                    style={
                      isActive
                        ? { background: 'linear-gradient(135deg, #ff5200, #cc2200)', boxShadow: '0 0 24px rgba(255,82,0,0.35)' }
                        : isComplete
                        ? { background: 'rgba(255,82,0,0.3)' }
                        : {}
                    }
                  >
                    {isComplete && !isActive ? <Check className="h-3.5 w-3.5" /> : item.stepNumber}
                  </div>
                  <div className={`mt-2 text-[12px] font-sans ${isActive ? "text-[#F5F1EA] font-semibold" : "text-[#A0A6AF]"}`}>{item.label}</div>
                </div>

                {index < steps.length - 1 ? (
                  <div className={`mx-2 h-px flex-1 transition-all duration-300 ${currentStepNumber > item.stepNumber ? "bg-[#ff5200]" : "bg-[#1A1F28]"}`} />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-[#1A1F28] bg-[#0A0F18] p-6 md:p-8">
          {step === 1 ? (
            <div>
              <h2 className="text-2xl font-orbitron font-black text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>How would you like to play?</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <button
                  onClick={() => {
                    setBookingMode('setup');
                    setSelectedDuration('');
                  }}
                  className={`p-6 rounded-2xl text-center transition-all duration-300 ${
                    bookingMode === 'setup'
                      ? 'border-2 border-[#ff5200] bg-[rgba(255,82,0,0.05)] shadow-[0_0_20px_rgba(255,82,0,0.15)]'
                      : 'border border-[#1A1F28] bg-[#050508] text-[#A0A6AF] hover:border-[rgba(255,82,0,0.5)] hover:translate-y-[-4px]'
                  }`}
                >
                  <div className="text-4xl mb-3">🎮</div>
                  <div className="text-xl font-orbitron font-black mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>Specific Setup</div>
                  <p className="text-sm font-sans opacity-80">Choose exact console or rig</p>
                </button>

                <button
                  onClick={() => {
                    setBookingMode('allAccess');
                    setSelectedSetup(null);
                    setSelectedSessionType(null);
                    setSelectedDuration('');
                  }}
                  className={`p-6 rounded-2xl text-center transition-all duration-300 ${
                    bookingMode === 'allAccess'
                      ? 'border-2 border-[#ff5200] bg-[rgba(255,82,0,0.05)] shadow-[0_0_20px_rgba(255,82,0,0.15)]'
                      : 'border border-[#1A1F28] bg-[#050508] text-[#A0A6AF] hover:border-[rgba(255,82,0,0.5)] hover:translate-y-[-4px]'
                  }`}
                >
                  <div className="text-4xl mb-3">⏱️</div>
                  <div className="text-xl font-orbitron font-black mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>All-Access Pass</div>
                  <p className="text-sm font-sans opacity-80">Pay by time, use any setup</p>
                </button>
              </div>

              {bookingMode === 'setup' ? (
                <div>
                  <h3 className="text-xl font-orbitron font-black text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>Choose your gaming setup</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {setups
                          .filter((s: any) => s.is_active !== false)
                          .map((setup) => (
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
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-orbitron font-black text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>Choose duration</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {allAccessPrices['30min'] ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDuration('30min');
                          const allAccess30 = sessionTypes.find((s) => s.name === 'All-Access - 30min');
                          if (allAccess30) {
                            setSelectedSessionType(allAccess30);
                            setSelectedSetup(null);
                            setBookingMode('allAccess');
                          }
                        }}
                        className={`p-6 rounded-2xl text-center transition-all duration-300 ${
                          selectedDuration === '30min'
                            ? 'border-2 border-[#ff5200] bg-[rgba(255,82,0,0.05)] shadow-[0_0_20px_rgba(255,82,0,0.15)]'
                            : 'border border-[#1A1F28] bg-[#050508] text-[#A0A6AF] hover:border-[rgba(255,82,0,0.5)]'
                        }`}
                      >
                        <div className="text-3xl mb-2">⏱️ 30 Minutes</div>
                        <div className="text-2xl font-bold text-[#ff5200]" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>₹{allAccessPrices['30min'].price}</div>
                        <p className="text-xs mt-2 font-sans text-[#A0A6AF]">+{allAccessPrices['30min'].coins} H Coins</p>
                      </button>
                    ) : null}

                    {allAccessPrices['1hr'] ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDuration('1hr');
                          const allAccess1hr = sessionTypes.find((s) => s.name === 'All-Access - 1hr');
                          if (allAccess1hr) {
                            setSelectedSessionType(allAccess1hr);
                            setSelectedSetup(null);
                            setBookingMode('allAccess');
                          }
                        }}
                        className={`p-6 rounded-2xl text-center transition-all duration-300 ${
                          selectedDuration === '1hr'
                            ? 'border-2 border-[#ff5200] bg-[rgba(255,82,0,0.05)] shadow-[0_0_20px_rgba(255,82,0,0.15)]'
                            : 'border border-[#1A1F28] bg-[#050508] text-[#A0A6AF] hover:border-[rgba(255,82,0,0.5)]'
                        }`}
                      >
                        <div className="text-3xl mb-2">⏱️ 1 Hour</div>
                        <div className="text-2xl font-bold text-[#ff5200]" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>₹{allAccessPrices['1hr'].price}</div>
                        <p className="text-xs mt-2 font-sans text-[#A0A6AF]">+{allAccessPrices['1hr'].coins} H Coins</p>
                      </button>
                    ) : null}
                  </div>
                  <p className="text-sm font-sans text-[#A0A6AF] mt-4 text-center">
                    {allAccessPrices['30min'] || allAccessPrices['1hr']
                      ? '🎮 Use any available setup (PS5, PS4, Arcade, Racing, PC)'
                      : 'All-Access passes are currently unavailable.'}
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={
                  (bookingMode === 'setup' && !selectedSetup) || (bookingMode === 'allAccess' && !selectedDuration)
                }
                onClick={() => setStep(2)}
                className="btn-primary mt-8 w-full rounded-lg px-6 py-3 text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          ) : null}

          {step === 2 && (selectedSetup || bookingMode === 'allAccess') ? (
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-orbitron font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>
                    {bookingMode === 'allAccess' ? 'Choose duration' : selectedSetup?.name === "racing" ? "How would you like to play?" : "Choose session type"}
                  </h2>
                  <p className="mt-1 text-sm font-sans text-[#A0A6AF]">
                    {bookingMode === 'allAccess'
                      ? 'Pick the pass length that fits your session'
                      : selectedSetup?.name === "racing"
                      ? "Time-based and lap-based race sessions"
                      : selectedSetup?.display_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 font-sans text-[#A0A6AF] transition-colors hover:text-[#ff5200]"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>

              <div className={`mt-5 grid gap-4 ${bookingMode === 'allAccess' ? 'md:grid-cols-2' : selectedSetup?.name === "racing" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                {eligibleSessionTypes.map((sessionType) => {
                  const isSelected = selectedSessionType?.id === sessionType.id;
                  const priceKey = `${selectedSetup?.id}_${sessionType.name}`;
                  const price =
                    bookingMode === 'allAccess'
                      ? sessionType.price_per_hour
                      : typeof currentPrices[priceKey] === "number"
                      ? currentPrices[priceKey]
                      : calculateBookingPrice(selectedSetup as Setup, sessionType);
                  const sessionDescription =
                    bookingMode === 'allAccess'
                      ? sessionType.name.includes('30min')
                        ? '30 Minutes - All-Access'
                        : '1 Hour - All-Access'
                      : selectedSetup?.name === "racing"
                      ? sessionType.name === "30 Minutes"
                        ? "Timed race session"
                        : "10 lap challenge"
                      : `Up to ${sessionType.max_players} players`;

                  return (
                    <button
                      key={sessionType.id}
                      type="button"
                      onClick={() => {
                        setSelectedSessionType(sessionType);
                        setSelectedSlot(null);
                      }}
                      className={`rounded-xl border p-5 text-left transition-all duration-300 ${
                        isSelected
                          ? "border-2 border-[#ff5200] bg-[rgba(255,82,0,0.05)] shadow-[0_0_20px_rgba(255,82,0,0.15)] selected-card"
                          : "border-[#1A1F28] bg-[#050508] hover:border-[rgba(255,82,0,0.5)] hover:translate-y-[-4px]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[18px] font-orbitron font-black text-[#F5F1EA]" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>{sessionType.name}</div>
                        <div className="text-[26px] text-[#ff5200]" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>Rs. {price}</div>
                      </div>
                      <div className="mt-3 text-[13px] font-sans text-[#A0A6AF]">{sessionDescription}</div>
                      <div className="mt-2 text-[12px] font-sans font-semibold text-[#22C55E]">+{sessionType.h_coins_earned} H Coins</div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedSessionType}
                onClick={() => setStep(3)}
                className="btn-primary mt-8 w-full rounded-lg px-6 py-3 text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          ) : null}

          {step === 3 && selectedSessionType && (selectedSetup || bookingMode === 'allAccess') ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-orbitron font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>Select date and time</h2>
                  <p className="mt-1 text-sm font-sans text-[#A0A6AF]">
                    {bookingMode === 'allAccess' ? 'All-Access Pass' : selectedSetup?.display_name} / {selectedSessionType.name} / <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#ff5200' }}>Rs. {totalPrice}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 font-sans text-[#A0A6AF] transition-colors hover:text-[#ff5200]"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>

              <div>
                <label className="text-[13px] font-sans font-semibold text-[#A0A6AF] tracking-[0.05em]">Select Date</label>
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
                        className={`min-w-23 rounded-lg border p-3 text-center transition-all duration-300 ${
                          isSelected
                            ? "border-[#ff5200] bg-[rgba(255,82,0,0.08)] shadow-[0_0_0_2px_rgba(255,82,0,0.2)]"
                            : "border-[#1A1F28] bg-[#050508] hover:border-[rgba(255,82,0,0.5)]"
                        }`}
                      >
                        <div className="text-[11px] font-sans font-semibold uppercase text-[#A0A6AF]">{date.dayName}</div>
                        <div className="mt-1 text-[22px] font-orbitron font-black text-[#F5F1EA]" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>{date.dayNumber}</div>
                        <div className="mt-1 text-[11px] font-sans text-[#A0A6AF]">{date.month}</div>
                        {date.isToday ? <div className="mx-auto mt-2 h-1.5 w-1.5 rounded-full bg-[#ff5200]" /> : <div className="mt-2 h-1.5" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[13px] font-sans text-[#A0A6AF]">Showing next 14 days. Contact us for further dates.</p>
              </div>

              {availabilityLoading ? (
                <div className="py-8">
                  <GamingLoader />
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-xl border border-[#1A1F28] bg-[#0A0F18]" />
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
                <div className="flex flex-col gap-3 rounded-xl border border-[#1A1F28] bg-[#050508] px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="font-sans text-[#A0A6AF]">
                    Selected: <span className="font-semibold text-[#ff5200]">{selectedSlot.label}</span>
                  </div>
                  <div className="font-sans text-[#A0A6AF]">
                    Total: <span className="text-2xl text-[#ff5200]" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>Rs. {totalPrice}</span>
                  </div>
                </div>
              ) : null}

              {error ? <div className="rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm font-sans text-[#EF4444]">{error}</div> : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-outline flex-1 rounded-lg px-5 py-2.5 font-sans font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot || loading}
                  onClick={() => setStep(4)}
                  className="btn-primary flex-1 rounded-lg px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Review Booking
                </button>
              </div>
            </div>
          ) : null}

          {step === 4 && selectedSessionType && selectedSlot && selectedDate && (selectedSetup || bookingMode === 'allAccess') ? (
            <div>
              <h2 className="text-xl font-orbitron font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>Review your booking</h2>

              <div className="mt-6 rounded-xl border border-[rgba(255,82,0,0.2)] bg-[#050508] p-6" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(255,82,0,0.05)' }}>
                <div className="flex items-center justify-between border-b border-[#1A1F28] py-3">
                  <div className="text-[14px] font-sans text-[#A0A6AF]">Setup</div>
                  <div className="text-right text-[15px] font-sans font-bold text-[#F5F1EA]">
                    {selectedSessionType.name.startsWith('All-Access') ? '🎮 Any Setup (Switch freely)' : selectedSetup?.display_name}
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-[#1A1F28] py-3">
                  <div className="text-[14px] font-sans text-[#A0A6AF]">Session</div>
                  <div className="text-right text-[15px] font-sans font-bold text-[#F5F1EA]">
                    {selectedSessionType.name.startsWith('All-Access')
                      ? selectedSessionType.name.replace('All-Access - ', '')
                      : `${selectedSessionType.name} (${selectedSessionType.max_players} players)`}
                  </div>
                </div>
                {selectedSessionType.name.startsWith('All-Access') && (
                  <div className="flex items-center justify-between border-b border-[#1A1F28] py-3">
                    <div className="text-[14px] font-sans text-[#A0A6AF]">Duration</div>
                    <div className="text-right text-[15px] font-sans font-bold text-[#F5F1EA]">{selectedSessionType.name.includes('30min') ? '30 Minutes' : '1 Hour'}</div>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-[#1A1F28] py-3">
                  <div className="text-[14px] font-sans text-[#A0A6AF]">Date</div>
                  <div className="text-right text-[15px] font-sans font-bold text-[#F5F1EA]">{formatDateLabel(selectedDate)}</div>
                </div>
                <div className="flex items-center justify-between border-b border-[#1A1F28] py-3">
                  <div className="text-[14px] font-sans text-[#A0A6AF]">Time</div>
                  <div className="text-right text-[15px] font-sans font-bold text-[#F5F1EA]">{selectedSlot.label}</div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="text-[16px] font-sans font-bold text-[#F5F1EA]">Total</div>
                  <div className="text-[28px] text-[#ff5200]" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>Rs. {totalPrice}</div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-[rgba(255,82,0,0.2)] bg-[rgba(255,82,0,0.05)] px-4 py-3 text-[13px] font-sans text-[#A0A6AF]">
                <Sparkles className="mr-2 inline-block h-4 w-4 text-[#ff5200]" />
                You&apos;ll earn {selectedSessionType.h_coins_earned} H Coins for this booking.
                {selectedSessionType.name.startsWith('All-Access') && (
                  <div className="text-xs text-[#A0A6AF] mt-2">🎮 You can use ANY available setup (PS5, PS4, Arcade, Racing, PC)</div>
                )}
              </div>

              {error ? <div className="mt-4 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-[13px] font-sans text-[#EF4444]">{error}</div> : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-outline rounded-lg px-5 py-2.5 text-[14px] font-sans font-semibold"
                >
                  Change Slot
                </button>
                <button
                  type="button"
                  onClick={confirmBooking}
                  disabled={loading}
                  className="btn-primary rounded-lg px-5 py-2.5 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
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