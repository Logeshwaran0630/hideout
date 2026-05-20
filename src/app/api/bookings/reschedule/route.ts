import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cancelCalendarEvent, createCalendarEvent } from "@/lib/googleCalendar";
import { sendBookingConfirmationEmail } from "@/lib/email";
import type { Booking, User } from "@/lib/emailService";

type RescheduleRequestBody = {
  bookingId?: string;
  newDate?: string;
  newTimeSlotId?: string;
};

function buildDateTime(date: string, time: string) {
  const [hours, minutes] = time.split(":");
  const value = new Date(date);
  value.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return value;
}

function getBookingDateTime(bookingDate: string, startTime?: string | null) {
  if (!startTime) return null;

  const normalizedTime = startTime.slice(0, 5);
  const value = new Date(`${bookingDate}T${normalizedTime}:00+05:30`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RescheduleRequestBody;
    if (!body.bookingId || !body.newDate || !body.newTimeSlotId) {
      return NextResponse.json({ error: "Missing booking details" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_code,
        booking_date,
        status,
        total_price,
        calendar_event_id,
        user_id,
        setup_id,
        time_slots (label, start_time, end_time),
        session_types (name),
        setups (display_name),
        users (id, email, display_name, h_id)
      `)
      .eq("id", body.bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: adminCheck } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (booking.user_id !== user.id && adminCheck?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bookingTime = getBookingDateTime(booking.booking_date, booking.time_slots?.[0]?.start_time);
    if (!bookingTime || bookingTime.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Only upcoming bookings can be rescheduled" }, { status: 400 });
    }

    const { data: newTimeSlot, error: slotError } = await supabase
      .from("time_slots")
      .select("id, label, start_time, end_time")
      .eq("id", body.newTimeSlotId)
      .single();

    if (slotError || !newTimeSlot) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    const { data: conflict } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_date", body.newDate)
      .eq("time_slot_id", body.newTimeSlotId)
      .eq("setup_id", booking.setup_id)
      .maybeSingle();

    if (conflict && conflict.id !== body.bookingId) {
      return NextResponse.json({ error: "The selected slot is already booked" }, { status: 409 });
    }

    if (booking.calendar_event_id) {
      await cancelCalendarEvent(booking.calendar_event_id);
    }

    const userProfile: User = booking.users?.[0] ?? {
      id: user.id,
      email: user.email ?? "",
      display_name: user.user_metadata?.display_name ?? user.email ?? null,
      h_id: null,
    };

    const startDateTime = buildDateTime(body.newDate, newTimeSlot.start_time);
    const endDateTime = buildDateTime(body.newDate, newTimeSlot.end_time);
    const newCalendarEventId = await createCalendarEvent({
      summary: `Hideout Booking - ${userProfile.display_name || userProfile.email || "Customer"} (Rescheduled)`,
      description: `Rescheduled from ${booking.booking_date} ${booking.time_slots?.[0]?.label}`,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        booking_date: body.newDate,
        time_slot_id: body.newTimeSlotId,
        calendar_event_id: newCalendarEventId,
        rescheduled_from: booking.booking_code,
        rescheduled_at: new Date().toISOString(),
      })
      .eq("id", body.bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const rescheduledBooking: Booking = {
      id: booking.id,
      booking_code: booking.booking_code,
      booking_date: body.newDate,
      total_price: booking.total_price ?? 0,
      time_slots: {
        label: newTimeSlot.label,
      },
      session_types: booking.session_types?.[0] ?? null,
      users: userProfile,
    };

    await sendBookingConfirmationEmail(rescheduledBooking);

    return NextResponse.json({
      success: true,
      message: "Booking rescheduled successfully",
      newDate: body.newDate,
      newTime: newTimeSlot.label,
    });
  } catch (error) {
    console.error("Reschedule error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
