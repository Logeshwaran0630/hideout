"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Calendar, Clock, Power, RefreshCw, Save } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { loadTimeSlotAvailability } from "@/lib/timeSlotAvailability";

type TimeSlot = {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  sort_order: number;
};

type Message = {
  type: "success" | "error";
  text: string;
};

export default function TimeSlotManagement() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayReason, setHolidayReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    void loadTimeSlots();
  }, []);

  useEffect(() => {
    if (timeSlots.length > 0) {
      void loadScheduleForDate();
    }
  }, [selectedDate, timeSlots.length]);

  async function loadTimeSlots() {
    setLoading(true);
    const { data, error } = await supabase.from("time_slots").select("id, label, start_time, end_time, sort_order").order("sort_order");

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setTimeSlots((data ?? []) as TimeSlot[]);
    setLoading(false);
  }

  async function loadScheduleForDate() {
    setLoading(true);
    const availability = await loadTimeSlotAvailability(supabase, selectedDate);
    setIsHoliday(availability.isHoliday);
    setHolidayReason(availability.holidayReason ?? "");
    setOverrides(availability.overrides);
    setLoading(false);
  }

  function showMessage(nextMessage: Message) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(null), 2500);
  }

  async function toggleTimeSlot(slotId: string, currentStatus: boolean) {
    setSaving(true);

    const { error } = await supabase.from("time_slot_overrides").upsert({
      date: selectedDate,
      time_slot_id: slotId,
      is_enabled: !currentStatus,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      showMessage({ type: "error", text: error.message || "Failed to update time slot" });
    } else {
      setOverrides((previous) => ({ ...previous, [slotId]: !currentStatus }));
      showMessage({ type: "success", text: "Time slot updated" });
    }

    setSaving(false);
  }

  async function toggleHoliday() {
    setSaving(true);

    if (isHoliday) {
      const { error } = await supabase.from("holiday_schedule").delete().eq("date", selectedDate);

      if (error) {
        showMessage({ type: "error", text: error.message || "Failed to remove holiday" });
      } else {
        setIsHoliday(false);
        setHolidayReason("");
        showMessage({ type: "success", text: "Holiday removed" });
      }
    } else {
      const reason = holidayReason.trim() || "Holiday";
      const { error } = await supabase.from("holiday_schedule").upsert({
        date: selectedDate,
        reason,
        is_closed: true,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        showMessage({ type: "error", text: error.message || "Failed to set holiday" });
      } else {
        setIsHoliday(true);
        setHolidayReason(reason);
        showMessage({ type: "success", text: "Holiday set" });
      }
    }

    setSaving(false);
  }

  function isSlotEnabled(slotId: string) {
    if (isHoliday) return false;
    if (overrides[slotId] !== undefined) return overrides[slotId];
    return true;
  }

  async function copyFromPreviousDay() {
    setSaving(true);

    const previousDate = new Date(`${selectedDate}T00:00:00`);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = previousDate.toISOString().slice(0, 10);

    const [{ data: prevHoliday }, { data: prevOverrides }] = await Promise.all([
      supabase.from("holiday_schedule").select("reason, is_closed").eq("date", previousDateString).maybeSingle<{ reason: string | null; is_closed: boolean | null }>(),
      supabase.from("time_slot_overrides").select("time_slot_id, is_enabled").eq("date", previousDateString),
    ]);

    if (!prevHoliday && (!prevOverrides || prevOverrides.length === 0)) {
      showMessage({ type: "error", text: "No schedule found for previous day" });
      setSaving(false);
      return;
    }

    await supabase.from("holiday_schedule").delete().eq("date", selectedDate);
    await supabase.from("time_slot_overrides").delete().eq("date", selectedDate);

    if (prevHoliday?.is_closed) {
      const { error } = await supabase.from("holiday_schedule").upsert({
        date: selectedDate,
        reason: prevHoliday.reason || "Holiday",
        is_closed: true,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        showMessage({ type: "error", text: error.message || "Failed to copy holiday" });
        setSaving(false);
        return;
      }

      setIsHoliday(true);
      setHolidayReason(prevHoliday.reason || "Holiday");
      setOverrides({});
      showMessage({ type: "success", text: "Holiday copied from previous day" });
      setSaving(false);
      return;
    }

    const copiedOverrides: Record<string, boolean> = {};
    for (const override of prevOverrides ?? []) {
      const enabled = override.is_enabled !== false;
      copiedOverrides[override.time_slot_id] = enabled;

      const { error } = await supabase.from("time_slot_overrides").upsert({
        date: selectedDate,
        time_slot_id: override.time_slot_id,
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        showMessage({ type: "error", text: error.message || "Failed to copy schedule" });
        setSaving(false);
        return;
      }
    }

    setIsHoliday(false);
    setHolidayReason("");
    setOverrides(copiedOverrides);
    showMessage({ type: "success", text: "Schedule copied from previous day" });
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#ff5200]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#ff5200]">SCHEDULE</div>
          <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#F5F1EA]">TIME SLOT MANAGEMENT</h1>
          <p className="mt-2 text-sm text-[#A0A6AF]">Enable or disable bookings for specific dates.</p>
        </div>

        <button
          type="button"
          onClick={() => void loadScheduleForDate()}
          className="inline-flex items-center gap-2 rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-sm text-[#A0A6AF] transition hover:border-[#ff5200] hover:text-[#F5F1EA]"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="mb-1 block text-sm text-[#A0A6AF]">Select Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
            />
          </label>

          <label className="block flex-1 min-w-64">
            <span className="mb-1 block text-sm text-[#A0A6AF]">Holiday Reason</span>
            <input
              value={holidayReason}
              onChange={(event) => setHolidayReason(event.target.value)}
              placeholder="Optional reason shown to the team"
              className="w-full rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
            />
          </label>

          <button
            type="button"
            onClick={() => void toggleHoliday()}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 transition ${isHoliday ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"}`}
          >
            <AlertCircle className="h-4 w-4" />
            {isHoliday ? "Remove Holiday" : "Mark as Holiday"}
          </button>

          <button
            type="button"
            onClick={() => void copyFromPreviousDay()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-blue-400 transition hover:bg-blue-500/30 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Copy Previous Day
          </button>
        </div>

        {isHoliday ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Holiday active for {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN")}</span>
            </div>
            {holidayReason ? <p className="mt-1 text-red-300/80">Reason: {holidayReason}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-[28px] uppercase text-[#F5F1EA]">
          <Clock className="h-5 w-5 text-[#ff5200]" />
          Time Slots for {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {timeSlots.map((slot) => {
            const enabled = isSlotEnabled(slot.id);

            return (
              <div key={slot.id} className={`flex items-center justify-between rounded-xl border p-4 ${enabled ? "border-[#2A2F38] bg-[#0A0F18]" : "border-red-500/30 bg-red-500/10"}`}>
                <div>
                  <div className={`text-[15px] font-semibold ${enabled ? "text-[#F5F1EA]" : "text-red-300"}`}>{slot.label}</div>
                  <div className="text-xs text-[#A0A6AF]">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</div>
                </div>

                <button
                  type="button"
                  onClick={() => void toggleTimeSlot(slot.id, enabled)}
                  disabled={isHoliday || saving}
                  className={`rounded-lg p-2 transition ${enabled ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-[#A0A6AF]">Disabled time slots will not be available for booking on the selected date.</p>
      </div>
    </div>
  );
}