import type { SupabaseClient } from "@supabase/supabase-js";

type HolidayRow = {
  reason: string | null;
  is_closed: boolean | null;
};

type OverrideRow = {
  time_slot_id: string;
  is_enabled: boolean | null;
};

export type TimeSlotAvailability = {
  isHoliday: boolean;
  holidayReason: string | null;
  overrides: Record<string, boolean>;
};

export async function loadTimeSlotAvailability(supabase: SupabaseClient, date: string): Promise<TimeSlotAvailability> {
  const [{ data: holiday }, { data: overrideRows }] = await Promise.all([
    supabase.from("holiday_schedule").select("reason, is_closed").eq("date", date).maybeSingle<HolidayRow>(),
    supabase.from("time_slot_overrides").select("time_slot_id, is_enabled").eq("date", date),
  ]);

  const overrides: Record<string, boolean> = {};
  for (const row of (overrideRows ?? []) as OverrideRow[]) {
    overrides[row.time_slot_id] = row.is_enabled !== false;
  }

  return {
    isHoliday: Boolean(holiday?.is_closed),
    holidayReason: holiday?.reason ?? null,
    overrides,
  };
}

export async function assertTimeSlotIsBookable(supabase: SupabaseClient, date: string, timeSlotId: string) {
  const availability = await loadTimeSlotAvailability(supabase, date);

  if (availability.isHoliday) {
    return {
      allowed: false,
      message: availability.holidayReason
        ? `Centre is closed on this date: ${availability.holidayReason}`
        : "Centre is closed on this date.",
    };
  }

  if (availability.overrides[timeSlotId] === false) {
    return {
      allowed: false,
      message: "This time slot is disabled for the selected date.",
    };
  }

  return { allowed: true as const, message: null };
}