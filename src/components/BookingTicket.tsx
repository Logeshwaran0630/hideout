"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle, Clock, Gift, Printer, QrCode, Users } from "lucide-react";
import { generateQRCode } from "@/lib/qrcode";

type TimeSlot = {
  label: string;
  start_time?: string;
  end_time?: string;
};

type SessionType = {
  name: string;
  max_players?: number;
  h_coins_earned?: number;
};

type Setup = {
  display_name: string;
  badge?: string;
};

type BookingLike = {
  id: string;
  booking_code: string;
  booking_date: string;
  total_price: number;
  payment_status: string;
  payment_mode?: string;
  time_slots?: TimeSlot | TimeSlot[] | null;
  session_types?: SessionType | SessionType[] | null;
  setups?: Setup | Setup[] | null;
};

interface BookingTicketProps {
  booking: BookingLike;
  customerName: string;
  hId: string;
  isPast?: boolean;
  onClose?: () => void;
  isAdmin?: boolean;
}

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeRange(slot: TimeSlot | null) {
  if (!slot) {
    return "Time TBD";
  }

  if (slot.start_time && slot.end_time) {
    return `${slot.start_time} - ${slot.end_time}`;
  }

  return slot.label || "Time TBD";
}

export default function BookingTicket({
  booking,
  customerName,
  hId,
  isPast = false,
  onClose,
  isAdmin = false,
}: BookingTicketProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const timeSlot = firstItem(booking.time_slots);
  const sessionType = firstItem(booking.session_types);
  const setup = firstItem(booking.setups);
  const earnedCoins = sessionType?.h_coins_earned ?? 0;

  useEffect(() => {
    if (!isPast) {
      generateQRCode(booking.booking_code).then(setQrCodeUrl);
    }
  }, [booking.booking_code, isPast]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${booking.booking_code}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 24px; background: #050508; color: #fff; }
            .ticket { max-width: 420px; margin: 0 auto; background: linear-gradient(180deg, #0A0F18, #050508); border: 2px solid #ff5200; border-radius: 18px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ff5200, #cc2200); padding: 18px; text-align: center; }
            .header h2 { margin: 0; font-size: 28px; letter-spacing: 0.1em; font-family: 'Orbitron', sans-serif; }
            .header p { margin: 6px 0 0; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.8; }
            .body { padding: 20px; }
            .code, .amount, .coin, .hid { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.08em; }
            .code { font-size: 26px; color: #ff5200; text-align: center; margin-bottom: 18px; }
            .amount { color: #ff5200; }
            .detail { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #2A2F38; }
            .detail span:first-child { color: #A0A6AF; }
            .footer { background: #0A0F18; padding: 14px 16px; text-align: center; font-size: 12px; color: #A0A6AF; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2>THE HIDEOUT</h2>
              <p>Booking Pass</p>
            </div>
            <div class="body">
              <div class="code">${booking.booking_code}</div>
              <div class="detail"><span>Date</span><span>${formatDate(booking.booking_date)}</span></div>
              <div class="detail"><span>Time</span><span>${formatTimeRange(timeSlot)}</span></div>
              <div class="detail"><span>Setup</span><span>${setup?.display_name || "Standard"}</span></div>
              <div class="detail"><span>Session</span><span>${sessionType?.name || "Standard"}</span></div>
              <div class="detail"><span>H Coins</span><span class="coin">+${earnedCoins}</span></div>
              <div class="detail"><span>H-ID</span><span class="hid">${hId}</span></div>
              <div class="detail"><span>Amount</span><span class="amount">₹${booking.total_price}</span></div>
            </div>
            <div class="footer">
              <div>No. 5, Eswari Avenue, Kovilpathagai, AVADI, Chennai - 600062</div>
              <div style="margin-top: 6px;">Show this ticket at the counter</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="print-area font-accent">
      <div className="overflow-hidden rounded-2xl border border-[rgba(255,82,0,0.35)] bg-[linear-gradient(180deg,rgba(20,24,31,0.98),rgba(5,5,8,0.98))] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="border-b border-[rgba(255,82,0,0.22)] bg-[linear-gradient(135deg,#ff5200,#cc2200)] px-6 py-4 text-center">
          <div className="font-brand text-2xl font-black tracking-[0.12em] text-white">THE HIDEOUT</div>
          <div className="mt-1 text-xs uppercase tracking-[0.24em] text-white/80">Booking Pass</div>
        </div>

        <div className="space-y-6 p-6">
          {!isPast && (
            <div className="flex justify-center">
              {qrCodeUrl ? (
                <div className="rounded-2xl bg-white p-3">
                  <img src={qrCodeUrl} alt="QR Code" className="h-32 w-32" />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-[#2A2F38] bg-[#0A0F18]">
                  <QrCode className="h-12 w-12 text-[#A0A6AF]" />
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.22em] text-[#A0A6AF]">Booking Code</div>
            <div className="booking-code mt-1 text-3xl tracking-[0.14em] glow-orange">
              {booking.booking_code}
            </div>
            {isPast && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(74,222,128,0.24)] bg-[rgba(74,222,128,0.1)] px-3 py-1 text-xs font-semibold text-[#4ADE80]">
                <CheckCircle className="h-3.5 w-3.5" />
                Completed
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 border-b border-[#2A2F38] pb-2">
              <div className="flex items-center gap-2 text-sm text-[#A0A6AF]">
                <Calendar className="h-4 w-4" />
                Date
              </div>
              <div className="text-right font-medium text-white">{formatDate(booking.booking_date)}</div>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#2A2F38] pb-2">
              <div className="flex items-center gap-2 text-sm text-[#A0A6AF]">
                <Clock className="h-4 w-4" />
                Time
              </div>
              <div className="text-right font-medium text-white">{formatTimeRange(timeSlot)}</div>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#2A2F38] pb-2">
              <div className="flex items-center gap-2 text-sm text-[#A0A6AF]">
                <Users className="h-4 w-4" />
                Setup & Session
              </div>
              <div className="text-right font-medium text-white">
                {setup?.display_name || "Standard"} · {sessionType?.name || "Standard"}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#2A2F38] pb-2">
              <div className="flex items-center gap-2 text-sm text-[#A0A6AF]">
                <Gift className="h-4 w-4" />
                H Coins Earned
              </div>
              <div className="font-medium text-[#4ADE80]">+{earnedCoins}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#0A0F18] p-4 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-[#A0A6AF]">H-ID</div>
            <div className="hid-text mt-1 text-xl glow-orange">{hId}</div>
            <div className="mt-2 text-xs text-[#A0A6AF]">Customer: {customerName}</div>
          </div>

          <div
            className={`rounded-2xl border p-3 text-center ${
              booking.payment_status === "paid"
                ? "border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)]"
                : "border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)]"
            }`}
          >
            <div className="text-xs uppercase tracking-[0.18em] text-[#A0A6AF]">Payment Status</div>
            <div className={`text-lg font-bold ${booking.payment_status === "paid" ? "text-[#4ADE80]" : "text-[#F59E0B]"}`}>
              {booking.payment_status === "paid" ? "PAID" : "PENDING"}
            </div>
            {booking.payment_mode && booking.payment_status === "paid" && (
              <div className="mt-1 text-xs text-[#4ADE80]">via {booking.payment_mode.toUpperCase()}</div>
            )}
          </div>

          <div className="text-center">
            <div className="price-text text-2xl">₹{booking.total_price}</div>
            <div className="text-xs text-[#A0A6AF]">Total Amount</div>
          </div>
        </div>

        <div className="border-t border-[#2A2F38] bg-[#0A0F18] px-6 py-3 text-center">
          <div className="text-xs text-[#A0A6AF]">
            📍 No. 5, Eswari Avenue, Kovilpathagai, AVADI, Chennai - 600062
          </div>
          <div className="mt-2 text-xs text-[#A0A6AF]">
            {isPast ? "Thank you for gaming at The Hideout!" : "Show this ticket at the counter • Scan QR code for quick check-in"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#2A2F38] px-4 py-2 text-[#A0A6AF] transition hover:border-[#ff5200] hover:text-white"
        >
          <Printer className="h-4 w-4" />
          Print Ticket
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#2A2F38] px-4 py-2 text-[#A0A6AF] transition hover:border-[#ff5200] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Close
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="mt-3">
          <Link
            href="/admin"
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
