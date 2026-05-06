"use client";

import { AlertCircle, Calendar, CheckCircle2, Clock, Gift, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

  const coinProgress = Math.min((currentBalance / 100) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#27272A] bg-[#18181B] text-[#FAFAFA] shadow-2xl">
        {step === "success" ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#A855F7] bg-[rgba(168,85,247,0.14)] glow-purple">
              <CheckCircle2 className="h-8 w-8 text-[#A855F7]" />
            </div>
            <h2 className="mt-5 font-heading text-[32px] uppercase text-[#FAFAFA]">FREE SESSION REDEEMED</h2>
            <p className="mt-2 text-[14px] text-[#A1A1AA]">Your booking is confirmed and 100 H Coins were deducted.</p>

            <div className="mt-6 rounded-xl border border-[#27272A] bg-[#0A0A0A] p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#A1A1AA]">Booking Code</div>
              <div className="mt-2 font-mono text-[28px] tracking-widest text-[#A855F7]">{bookingCode}</div>
            </div>

            <button type="button" onClick={finish} className="btn-primary mt-6 w-full rounded-lg px-5 py-3 text-[14px] font-semibold text-[#FFFFFF]">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-[#27272A] p-6">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-[#A855F7]" />
                <div>
                  <h2 className="text-[22px] font-semibold text-[#FAFAFA]">Redeem Free Session</h2>
                  <p className="mt-1 text-[13px] text-[#A1A1AA]">100 H Coins gets you one solo hour.</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#A1A1AA] transition-colors hover:bg-[#0A0A0A] hover:text-[#FAFAFA]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-xl border border-[rgba(168,85,247,0.24)] bg-[rgba(168,85,247,0.08)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[13px] text-[#A1A1AA]">H Coins Balance</span>
                  <span className="font-heading text-[28px] uppercase text-[#A855F7]">{currentBalance}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#27272A]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899] transition-all duration-500" style={{ width: `${coinProgress}%` }} />
                </div>
                <p className="mt-2 text-[12px] text-[#A1A1AA]">
                  {currentBalance >= 100 ? "You have enough coins to redeem a free session." : `Need ${100 - currentBalance} more coins to redeem.`}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${step === "select" ? "bg-[#A855F7] text-[#0A0A0A]" : "bg-[#27272A] text-[#A1A1AA]"}`}>1</div>
                <div className="h-px w-16 bg-[#27272A]" />
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${step === "confirm" ? "bg-[#A855F7] text-[#0A0A0A]" : "bg-[#27272A] text-[#A1A1AA]"}`}>2</div>
              </div>

              {step === "select" ? (
                <div className="mt-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[#FAFAFA]">
                      <Calendar className="h-4 w-4 text-[#A855F7]" />
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
                              ? "border-[#A855F7] bg-[#27272A] glow-purple"
                              : "border-[#27272A] bg-[#0A0A0A] text-[#A1A1AA] hover:border-[#06B6D4]"
                          }`}
                        >
                          <div className="text-[10px] font-medium">{date.dayName}</div>
                          <div className="mt-1 text-[18px] font-semibold text-[#FAFAFA]">{date.dayNumber}</div>
                          <div className="mt-1 text-[10px]">{date.monthName}</div>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[12px] text-[#71717A]">Free sessions must be booked from tomorrow onward.</p>
                  </div>

                  {selectedDate ? (
                    <div>
                      <div className="flex items-center gap-2 text-[13px] font-medium text-[#FAFAFA]">
                        <Clock className="h-4 w-4 text-[#3B82F6]" />
                        Select Time Slot
                      </div>

                      {loadingAvailability ? (
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-14 animate-pulse rounded-lg border border-[#27272A] bg-[#0A0A0A]" />
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
                                    ? "border-[#A855F7] bg-[#27272A] text-[#FAFAFA] glow-purple"
                                    : isBooked
                                      ? "cursor-not-allowed border-[#27272A] bg-[#0A0A0A] text-[#71717A] opacity-50"
                                      : "border-[#27272A] bg-[#0A0A0A] text-[#A1A1AA] hover:border-[#3B82F6] hover:text-[#FAFAFA]"
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
                    disabled={!selectedDate || !selectedSlot || currentBalance < 100}
                    className="btn-primary w-full rounded-lg px-5 py-3 text-[14px] font-semibold text-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue to Confirm
                  </button>
                </div>
              ) : null}

              {step === "confirm" && selectedDate && selectedSlot ? (
                <div className="mt-6 space-y-5">
                  <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-5">
                    {[
                      { label: "Date", value: formatDateLabel(selectedDate) },
                      { label: "Time", value: selectedSlot.label },
                      { label: "Session", value: "Free Session (Solo)" },
                      { label: "Coins", value: "-100 H Coins" },
                      { label: "Price", value: "₹0" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between border-b border-[#27272A] py-3 last:border-b-0">
                        <span className="text-[13px] text-[#A1A1AA]">{item.label}</span>
                        <span className="text-right text-[14px] font-semibold text-[#FAFAFA]">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-[rgba(168,85,247,0.2)] bg-[rgba(168,85,247,0.08)] px-4 py-3 text-center text-[13px] text-[#A1A1AA]">
                    Free sessions do not earn additional H Coins.
                  </div>

                  {error ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-[13px] text-[#EF4444]">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => setStep("select")} className="btn-outline flex-1 rounded-lg px-5 py-3 text-[14px] font-semibold text-[#FAFAFA]">
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRedeem}
                      disabled={loadingRedeem}
                      className="flex-1 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#EC4899] px-5 py-3 text-[14px] font-semibold text-[#FFFFFF] transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
