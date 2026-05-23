import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { sendBookingConfirmationEmail } from "@/lib/email";

type RedemptionRequestBody = {
  booking_date?: string;
  time_slot_id?: string;
  bookingDate?: string;
  timeSlotId?: string;
};

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrowString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateString(tomorrow);
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, h_id, display_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: globalConfig } = await supabase
      .from("global_settings")
      .select("value")
      .eq("key", "h_coins")
      .single();

    const coinsForFreeSession = Number(globalConfig?.value?.coins_for_free_session ?? 100);

    const body = (await request.json()) as RedemptionRequestBody;
    const booking_date = body.booking_date ?? body.bookingDate;
    const time_slot_id = body.time_slot_id ?? body.timeSlotId;

    if (!time_slot_id || !isValidDate(booking_date)) {
      return NextResponse.json({ error: "Missing redemption details" }, { status: 400 });
    }

    if (booking_date < tomorrowString()) {
      return NextResponse.json({ error: "Free sessions must be booked at least 1 day in advance." }, { status: 400 });
    }

    const { data: ledger, error: ledgerError } = await supabase
      .from("h_coin_ledger")
      .select("amount")
      .eq("user_id", user.id);

    if (ledgerError) {
      return NextResponse.json({ error: "Could not check H Coins balance." }, { status: 500 });
    }

    const balance = (ledger ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    if (balance < coinsForFreeSession) {
      return NextResponse.json({ error: `Insufficient H Coins. You have ${balance} coins, need ${coinsForFreeSession} coins.` }, { status: 400 });
    }

    const { data: timeSlot, error: timeSlotError } = await supabase
      .from("time_slots")
      .select("id, label, start_time, end_time")
      .eq("id", time_slot_id)
      .single();

    if (timeSlotError || !timeSlot) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_date", booking_date)
      .eq("time_slot_id", time_slot_id)
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({ error: "This slot is already booked" }, { status: 409 });
    }

    const { data: sessionType, error: sessionTypeError } = await supabase
      .from("session_types")
      .select("id, name, max_players, h_coins_earned")
      .eq("name", "Solo")
      .maybeSingle();

    if (sessionTypeError || !sessionType) {
      return NextResponse.json({ error: "Solo session type not found. Please add it in Supabase." }, { status: 500 });
    }

    const startDateTime = new Date(`${booking_date}T${timeSlot.start_time}`);
    const endDateTime = new Date(`${booking_date}T${timeSlot.end_time}`);

    let calendarEventId: string | null = null;
    try {
      calendarEventId = await createCalendarEvent({
        summary: `Free Session - ${profile.display_name || profile.email} (${profile.h_id})`,
        description: [
          "Redeemed with H Coins",
          `${coinsForFreeSession} H Coins deducted`,
          "Free 1-hour Solo session",
          "No H Coins earned for this booking",
        ].join("\n"),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
    } catch (calendarError) {
      console.error("Calendar error:", calendarError);
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        setup_id: null,
        time_slot_id,
        session_type_id: sessionType.id,
        booking_date,
        player_count: 1,
        duration_minutes: 60,
        total_price: 0,
        calendar_event_id: calendarEventId,
        payment_status: "paid",
        payment_mode: "redeem",
        status: "confirmed",
        notes: "Redeemed with H Coins",
      })
      .select("id, booking_code, booking_date, total_price, time_slot_id, session_type_id, calendar_event_id")
      .single();

    if (bookingError || !booking) {
      console.error("Booking error:", bookingError);
      return NextResponse.json({ error: "Redemption booking failed. Please try again." }, { status: 500 });
    }

    const { error: ledgerWriteError } = await supabase.from("h_coin_ledger").insert({
      user_id: user.id,
      amount: -coinsForFreeSession,
      type: "redeem",
      reference_id: booking.id,
      description: `Redeemed ${coinsForFreeSession} coins for free session: ${booking.booking_code}`,
    });

    if (ledgerWriteError) {
      console.error("Ledger error:", ledgerWriteError);
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
      return NextResponse.json({ error: "Could not deduct H Coins. Please try again." }, { status: 500 });
    }

    const redemptionLogQuery = supabase.from("redemptions").insert({
      user_id: user.id,
      coins_redeemed: coinsForFreeSession,
      booking_id: booking.id,
      status: "completed",
    });

    const { error: redemptionLogError } = await redemptionLogQuery;

    if (redemptionLogError) {
      console.warn("Redemption log insert skipped:", redemptionLogError);
    }

    const bookingForEmail = {
      ...booking,
      users: {
        id: profile.id,
        email: profile.email || user.email || "",
        display_name: profile.display_name,
        h_id: profile.h_id,
      },
      time_slots: { label: timeSlot.label },
      session_types: {
        name: "Free Session (Redeemed)",
        max_players: 1,
        h_coins_earned: 0,
      },
    };

    try {
      await sendBookingConfirmationEmail(bookingForEmail);
    } catch (emailError) {
      console.error("Email error:", emailError);
    }

    return NextResponse.json({
      success: true,
      booking: {
        booking_code: booking.booking_code,
        booking_date,
        time_slot_id,
        total_price: 0,
      },
      message: `Free session booked successfully! ${coinsForFreeSession} H Coins deducted.`,
    });
  } catch (error) {
    console.error("Redeem API error:", error);
    return NextResponse.json({ error: "Redemption failed. Please try again." }, { status: 500 });
  }
}
