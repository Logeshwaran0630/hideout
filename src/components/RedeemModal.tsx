"use client";

import { AlertCircle, Calendar, CheckCircle2, Clock, Gift, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type RedeemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
};

type TimeSlot = {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  sort_order: number;
};

type RedeemStep = "select" | "confirm" | "success";

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function RedeemModal({ isOpen, onClose, onSuccess, currentBalance }: RedeemModalProps) {
  const [step, setStep] = useState<RedeemStep>("select");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loadingRedeem, setLoadingRedeem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState("");
  const [coinsForFreeSession, setCoinsForFreeSession] = useState(100);

  const dates = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index + 1);

      return {
        value: toLocalDateString(date),
        dayName: date.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
      };
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setStep("select");
    setSelectedDate("");
    setSelectedSlot(null);
    setBookedSlotIds([]);
    setError(null);
    setBookingCode("");
  }, [isOpen]);

  useEffect(() => {
    let active = true;

    async function fetchThreshold() {
      const { data } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "h_coins")
        .single();

      if (!active) return;
      const threshold = Number(data?.value?.coins_for_free_session ?? 100);
      if (Number.isFinite(threshold) && threshold > 0) {
        setCoinsForFreeSession(threshold);
      }
    }

    fetchThreshold();

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    let active = true;

    async function fetchAvailability() {
      setLoadingAvailability(true);
      setError(null);

      const response = await fetch(`/api/bookings?date=${selectedDate}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Availability failed");
      }

      const payload = (await response.json()) as {
        time_slots: TimeSlot[];
        booked_slot_ids: string[];
      };

      if (!active) return;

      setTimeSlots(payload.time_slots ?? []);
      setBookedSlotIds(payload.booked_slot_ids ?? []);
      setSelectedSlot(null);
      setLoadingAvailability(false);
    }

    fetchAvailability().catch(() => {
      if (!active) return;
      setLoadingAvailability(false);
      setError("Couldn't load available slots. Please try again.");
    });

    return () => {
      active = false;
    };
  }, [isOpen, selectedDate]);

  async function handleConfirmRedeem() {
    if (!selectedDate || !selectedSlot || loadingRedeem) return;

    setLoadingRedeem(true);
    setError(null);

    const response = await fetch("/api/redemptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        booking_date: selectedDate,
        time_slot_id: selectedSlot.id,
      }),
    });

    const payload = (await response.json()) as {
      booking?: { booking_code?: string };
      error?: string;
    };

    if (!response.ok) {
      setError(payload.error || "Redemption failed. Please try again.");

      setLoadingRedeem(false);
      return;
    }

    setBookingCode(payload.booking?.booking_code ?? "");
    setLoadingRedeem(false);
    setStep("success");
  }

  function finish() {
    onSuccess();
    onClose();
  }

  if (!isOpen) return null;

  const coinProgress = Math.min((currentBalance / coinsForFreeSession) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#2A2F38] bg-[#14181F] text-[#F5F1EA] shadow-2xl">
        {step === "success" ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#FF4500] bg-[rgba(255,69,0,0.14)] glow-box">
              <CheckCircle2 className="h-8 w-8 text-[#FF4500]" />
            </div>
            <h2 className="mt-5 font-heading text-[32px] uppercase text-[#F5F1EA]">FREE SESSION REDEEMED</h2>
            <p className="mt-2 text-[14px] text-[#A0A6AF]">Your booking is confirmed and {coinsForFreeSession} H Coins were deducted.</p>

            <div className="mt-6 rounded-xl border border-[#2A2F38] bg-[#0A0F18] p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#A0A6AF]">Booking Code</div>
              <div className="mt-2 font-mono text-[28px] tracking-widest text-[#FF4500]">{bookingCode}</div>
            </div>

            <button type="button" onClick={finish} className="btn-primary mt-6 w-full rounded-lg px-5 py-3 text-[14px] font-semibold text-[#F5F1EA]">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-[#2A2F38] p-6">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-[#FF4500]" />
                <div>
                  <h2 className="text-[22px] font-semibold text-[#F5F1EA]">Redeem Free Session</h2>
                  <p className="mt-1 text-[13px] text-[#A0A6AF]">{coinsForFreeSession} H Coins gets you one solo hour.</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#A0A6AF] transition-colors hover:bg-[#0A0F18] hover:text-[#F5F1EA]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-xl border border-[rgba(255,69,0,0.24)] bg-[rgba(255,69,0,0.08)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[13px] text-[#A0A6AF]">H Coins Balance</span>
                  <span className="font-heading text-[28px] uppercase text-[#FF4500]">{currentBalance}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2A2F38]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF5722] transition-all duration-500" style={{ width: `${coinProgress}%` }} />
                </div>
                <p className="mt-2 text-[12px] text-[#A0A6AF]">
                  {currentBalance >= coinsForFreeSession ? "You have enough coins to redeem a free session." : `Need ${coinsForFreeSession - currentBalance} more coins to redeem.`}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${step === "select" ? "bg-[#FF4500] text-[#0A0F18]" : "bg-[#2A2F38] text-[#A0A6AF]"}`}>1</div>
                <div className="h-px w-16 bg-[#2A2F38]" />
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${step === "confirm" ? "bg-[#FF4500] text-[#0A0F18]" : "bg-[#2A2F38] text-[#A0A6AF]"}`}>2</div>
              </div>

              {step === "select" ? (
                <div className="mt-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[#F5F1EA]">
                      <Calendar className="h-4 w-4 text-[#FF4500]" />
                      Select Date
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2 md:grid-cols-7">
                      {dates.map((date) => (
                        <button
                          key={date.value}
                          type="button"
                          onClick={() => setSelectedDate(date.value)}
                          className={`rounded-lg border p-2 text-center transition-all duration-150 ${
                            selectedDate === date.value
                              ? "border-[#FF4500] bg-[#2A2F38] glow-box"
                              : "border-[#2A2F38] bg-[#0A0F18] text-[#A0A6AF] hover:border-[#22C55E]"
                          }`}
                        >
                          <div className="text-[10px] font-medium">{date.dayName}</div>
                          <div className="mt-1 text-[18px] font-semibold text-[#F5F1EA]">{date.dayNumber}</div>
                          <div className="mt-1 text-[10px]">{date.monthName}</div>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[12px] text-[#71717A]">Free sessions must be booked from tomorrow onward.</p>
                  </div>

                  {selectedDate ? (
                    <div>
                      <div className="flex items-center gap-2 text-[13px] font-medium text-[#F5F1EA]">
                        <Clock className="h-4 w-4 text-[#FF4500]" />
                        Select Time Slot
                      </div>

                      {loadingAvailability ? (
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-14 animate-pulse rounded-lg border border-[#2A2F38] bg-[#0A0F18]" />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                          {timeSlots.map((slot) => {
                            const isBooked = bookedSlotIds.includes(slot.id);
                            const isSelected = selectedSlot?.id === slot.id;

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={isBooked}
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-lg border px-4 py-3 text-left text-[13px] transition-all duration-150 ${
                                  isSelected
                                    ? "border-[#FF4500] bg-[#2A2F38] text-[#F5F1EA] glow-box"
                                    : isBooked
                                      ? "cursor-not-allowed border-[#2A2F38] bg-[#0A0F18] text-[#71717A] opacity-50"
                                      : "border-[#2A2F38] bg-[#0A0F18] text-[#A0A6AF] hover:border-[#4ADE80] hover:text-[#F5F1EA]"
                                }`}
                              >
                                <div className="font-semibold">{slot.label}</div>
                                <div className="mt-1 text-[11px]">{isBooked ? "Taken" : "Available"}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {error ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-[13px] text-[#EF4444]">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setStep("confirm")}
                    disabled={!selectedDate || !selectedSlot || currentBalance < coinsForFreeSession}
                    className="btn-primary w-full rounded-lg px-5 py-3 text-[14px] font-semibold text-[#F5F1EA] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue to Confirm
                  </button>
                </div>
              ) : null}

              {step === "confirm" && selectedDate && selectedSlot ? (
                <div className="mt-6 space-y-5">
                  <div className="rounded-xl border border-[#2A2F38] bg-[#0A0F18] p-5">
                    {[
                      { label: "Date", value: formatDateLabel(selectedDate) },
                      { label: "Time", value: selectedSlot.label },
                      { label: "Session", value: "Free Session (Solo)" },
                      { label: "Coins", value: `-${coinsForFreeSession} H Coins` },
                      { label: "Price", value: "₹0" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between border-b border-[#2A2F38] py-3 last:border-b-0">
                        <span className="text-[13px] text-[#A0A6AF]">{item.label}</span>
                        <span className="text-right text-[14px] font-semibold text-[#F5F1EA]">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-[rgba(255,69,0,0.2)] bg-[rgba(255,69,0,0.08)] px-4 py-3 text-center text-[13px] text-[#A0A6AF]">
                    Free sessions do not earn additional H Coins.
                  </div>

                  {error ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-[13px] text-[#EF4444]">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => setStep("select")} className="btn-outline flex-1 rounded-lg px-5 py-3 text-[14px] font-semibold text-[#F5F1EA]">
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRedeem}
                      disabled={loadingRedeem}
                      className="flex-1 rounded-lg bg-gradient-to-r from-[#FF4500] to-[#FF5722] px-5 py-3 text-[14px] font-semibold text-[#F5F1EA] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingRedeem ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Redeeming...</span> : "Confirm Redemption"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
