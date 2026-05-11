"use client";

import { useState } from "react";
import { Calendar, Clock, Users, Copy, Check, Loader2, Sparkles, Smartphone, User, Hash } from "lucide-react";

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
}

interface SessionType {
  id: string;
  name: string;
  max_players: number;
  price_per_hour: number;
  h_coins_earned: number;
}

interface ManualBookingFormProps {
  timeSlots: TimeSlot[];
  sessionTypes: SessionType[];
}

export default function ManualBookingForm({ timeSlots, sessionTypes }: ManualBookingFormProps) {
  const [formData, setFormData] = useState({
    customerMessage: "",
    hId: "",
    customerName: "",
    bookingDate: "",
    timeSlotId: "",
    sessionTypeId: sessionTypes[0]?.id || "",
    notes: "",
  });

  const [userFound, setUserFound] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse message and auto-fill form
  const parseAndAutoFill = async () => {
    const message = formData.customerMessage;
    if (!message) return;

    setLoading(true);
    setError(null);

    // Extract H-ID (HID-000006 or HID-000001 format)
    const hIdMatch = message.match(/HID[-\s]*(\d{6})/i) || message.match(/(\d{6})/);
    const extractedHId = hIdMatch ? `HID-${hIdMatch[1]}` : null;

    // Extract time (7 PM, 7:00 PM, 19:00, 7pm)
    let extractedTime = null;
    const timePatterns = [
      /(\d{1,2})[:.](\d{2})?\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /at\s+(\d{1,2})\s*(am|pm)?/i,
    ];
    
    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        let hour = parseInt(match[1]);
        const isPM = match[3]?.toLowerCase() === 'pm' || match[2]?.toLowerCase() === 'pm';
        
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        
        extractedTime = hour;
        break;
      }
    }

    // Extract date (tomorrow, May 16, 16/05, 2026-05-16)
    let extractedDate = null;
    const today = new Date();
    
    if (message.toLowerCase().includes("tomorrow")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      extractedDate = tomorrow.toISOString().split('T')[0];
    } else {
      const datePatterns = [
        /(\d{1,2})[\/\-](\d{1,2})/,  // 16/05 or 16-05
        /(\d{4})-(\d{2})-(\d{2})/,   // 2026-05-16
        /(?:may|apr|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i,
      ];
      
      for (const pattern of datePatterns) {
        const match = message.match(pattern);
        if (match) {
          if (match[1].length === 4) {
            // YYYY-MM-DD format
            extractedDate = `${match[1]}-${match[2]}-${match[3]}`;
          } else {
            // DD/MM format
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const year = today.getFullYear();
            const parsedDate = new Date(year, month, day);
            if (parsedDate > today) {
              extractedDate = parsedDate.toISOString().split('T')[0];
            }
          }
          break;
        }
      }
    }

    // Extract session type
    let extractedSessionId = formData.sessionTypeId;
    if (message.toLowerCase().includes("solo") || message.includes("1 player")) {
      const solo = sessionTypes.find(s => s.name === "Solo");
      if (solo) extractedSessionId = solo.id;
    } else if (message.toLowerCase().includes("duo") || message.includes("2 player")) {
      const duo = sessionTypes.find(s => s.name === "Duo");
      if (duo) extractedSessionId = duo.id;
    } else if (message.toLowerCase().includes("squad") || message.includes("4 player") || message.includes("team")) {
      const squad = sessionTypes.find(s => s.name === "Squad");
      if (squad) extractedSessionId = squad.id;
    }

    // Find matching time slot
    let extractedSlotId = "";
    if (extractedTime !== null) {
      const slotsWithHour = timeSlots.map(slot => {
        const hour = parseInt(slot.start_time.split(':')[0]);
        return { ...slot, hour };
      });
      
      const exactMatch = slotsWithHour.find(s => s.hour === extractedTime);
      if (exactMatch) {
        extractedSlotId = exactMatch.id;
      } else {
        const closest = slotsWithHour.reduce((prev, curr) => {
          return Math.abs(curr.hour - extractedTime!) < Math.abs(prev.hour - extractedTime!) ? curr : prev;
        });
        extractedSlotId = closest.id;
      }
    }

    // Update form
    setFormData(prev => ({
      ...prev,
      hId: extractedHId || prev.hId,
      bookingDate: extractedDate || prev.bookingDate,
      timeSlotId: extractedSlotId || prev.timeSlotId,
      sessionTypeId: extractedSessionId,
    }));

    // If H-ID found, lookup user
    if (extractedHId) {
      try {
        const response = await fetch(`/api/admin/lookup-user?hId=${extractedHId}`);
        const data = await response.json();
        if (data.user) {
          setUserFound(data.user);
          setFormData(prev => ({ ...prev, customerName: data.user.display_name || data.user.email }));
        } else {
          setError(`User with H-ID ${extractedHId} not found. Ask customer to sign up first.`);
        }
      } catch (err) {
        console.error("Lookup error:", err);
        setError("Error looking up user");
      }
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    if (!formData.hId || !formData.bookingDate || !formData.timeSlotId) {
      setError("Please fill H-ID, Date, and Time Slot");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/manual-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hId: formData.hId,
          bookingDate: formData.bookingDate,
          timeSlotId: formData.timeSlotId,
          sessionTypeId: formData.sessionTypeId,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create booking");
        setLoading(false);
        return;
      }

      setResult(data);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Error creating booking");
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    if (result?.whatsappMessage) {
      await navigator.clipboard.writeText(result.whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate date options (next 30 days)
  const dateOptions = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dateOptions.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    });
  }

  if (result) {
    return (
      <div className="bg-[#18181B] border border-[#2A2A2A] rounded-2xl p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Booking Created!</h2>
          <p className="text-[#A1A1AA] mb-4">
            Booking Code: <span className="text-[#A855F7] font-mono font-bold">{result.booking?.code}</span>
          </p>
          
          <div className="bg-[#0A0A0A] rounded-xl p-4 mb-4 text-left">
            <h3 className="text-white font-semibold mb-2">📋 Booking Summary</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-[#A1A1AA]">H-ID:</span> {result.booking?.hId}</p>
              <p><span className="text-[#A1A1AA]">Customer:</span> {result.booking?.customerName}</p>
              <p><span className="text-[#A1A1AA]">Date:</span> {result.booking?.date}</p>
              <p><span className="text-[#A1A1AA]">Time:</span> {result.booking?.timeSlot}</p>
              <p><span className="text-[#A1A1AA]">Session:</span> {result.booking?.sessionType}</p>
              <p><span className="text-[#A1A1AA]">Price:</span> ₹{result.booking?.price}</p>
              <p><span className="text-[#A1A1AA]">H Coins:</span> +{result.booking?.coinsEarned}</p>
            </div>
          </div>
          
          <div className="bg-[#0A0A0A] rounded-xl p-4 mb-4 text-left border border-[#A855F7]/30">
            <p className="text-[#A1A1AA] text-sm mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-green-500" />
              Copy this message to send to customer:
            </p>
            <div className="bg-[#0A0A0A] rounded-lg p-3 text-sm whitespace-pre-wrap text-[#A1A1AA] font-mono text-xs max-h-60 overflow-auto">
              {result.whatsappMessage}
            </div>
          </div>
          
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white font-semibold rounded-xl hover:scale-105 transition-transform mb-3 w-full justify-center"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy WhatsApp Message"}
          </button>
          
          <button
            onClick={() => {
              setResult(null);
              setFormData({
                customerMessage: "",
                hId: "",
                customerName: "",
                bookingDate: "",
                timeSlotId: "",
                sessionTypeId: sessionTypes[0]?.id || "",
                notes: "",
              });
              setUserFound(null);
            }}
            className="w-full px-6 py-3 border border-[#2A2A2A] text-[#A1A1AA] font-semibold rounded-xl hover:border-[#A855F7] transition-colors"
          >
            Create Another Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#18181B] border border-[#2A2A2A] rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Paste WhatsApp Message - Auto-fill */}
        <div className="bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-xl p-4">
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#A855F7]" />
            📱 Step 1: Paste Customer WhatsApp Message
          </label>
          <textarea
            value={formData.customerMessage}
            onChange={(e) => setFormData({ ...formData, customerMessage: e.target.value })}
            placeholder={`Example messages that work:\n\n"HID-000006, book for May 16 at 7 PM Duo session"\n\n"My H-ID is HID-000001. I want to book Solo for tomorrow 3pm"\n\n"Hi, HID-000003 - Squad session on 16th May 8 PM"`}
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:border-[#A855F7] outline-none resize-none text-sm"
          />
          <button
            type="button"
            onClick={parseAndAutoFill}
            disabled={!formData.customerMessage || loading}
            className="mt-3 px-4 py-2 text-sm bg-[#A855F7] text-white rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Auto-Fill Form from Message
          </button>
          <p className="text-xs text-[#A1A1AA] mt-2">
            System extracts: H-ID, Date, Time, Session Type
          </p>
        </div>

        <div className="border-t border-[#2A2A2A] pt-4">
          <p className="text-sm text-[#A1A1AA] mb-4">📝 Step 2: Verify and Confirm</p>
        </div>

        {/* H-ID Field */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#A855F7]" />
            Customer H-ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] text-sm">HID-</span>
            <input
              type="text"
              value={formData.hId.replace('HID-', '')}
              onChange={(e) => setFormData({ ...formData, hId: `HID-${e.target.value.replace(/[^0-9]/g, '')}` })}
              required
              className="w-full pl-12 pr-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:border-[#A855F7] outline-none"
              placeholder="000001"
            />
          </div>
          {userFound && (
            <p className="text-xs text-green-500 mt-1">✓ Customer found: {userFound.display_name || userFound.email}</p>
          )}
        </div>

        {/* Customer Name (Auto-filled) */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-[#A1A1AA]" />
            Customer Name
          </label>
          <input
            type="text"
            value={formData.customerName}
            readOnly
            className="w-full px-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-[#A1A1AA] cursor-not-allowed"
          />
          <p className="text-xs text-[#A1A1AA] mt-1">Auto-filled from H-ID lookup</p>
        </div>

        {/* Booking Date */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#A1A1AA]" />
            Booking Date <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.bookingDate}
            onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:border-[#A855F7] outline-none"
          >
            <option value="">Select date</option>
            {dateOptions.map((date) => (
              <option key={date.value} value={date.value}>
                {date.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Slot */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A1A1AA]" />
            Time Slot <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.timeSlotId}
            onChange={(e) => setFormData({ ...formData, timeSlotId: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:border-[#A855F7] outline-none"
          >
            <option value="">Select time slot</option>
            {timeSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        {/* Session Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#A1A1AA]" />
            Session Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.sessionTypeId}
            onChange={(e) => setFormData({ ...formData, sessionTypeId: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:border-[#A855F7] outline-none"
          >
            {sessionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - ₹{type.price_per_hour}/hour (+{type.h_coins_earned} coins)
              </option>
            ))}
          </select>
        </div>

        {/* Price Display */}
        {sessionTypes.find(s => s.id === formData.sessionTypeId) && (
          <div className="bg-[#0A0A0A] rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-[#A1A1AA]">Total Price:</span>
              <span className="text-2xl font-bold text-[#A855F7]">
                ₹{sessionTypes.find(s => s.id === formData.sessionTypeId)?.price_per_hour}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[#A1A1AA] text-sm">H Coins earned:</span>
              <span className="text-sm text-green-500">
                +{sessionTypes.find(s => s.id === formData.sessionTypeId)?.h_coins_earned} coins
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:border-[#A855F7] outline-none resize-none"
            placeholder="Any special requests or notes..."
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white font-semibold rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Booking...
            </span>
          ) : (
            "Confirm Booking & Generate WhatsApp Message"
          )}
        </button>
      </form>
    </div>
  );
}
