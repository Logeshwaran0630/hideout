import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendAdminAlertEmail, sendBookingConfirmationEmail } from "@/lib/email";
import { calculateBookingPrice, isRacingSessionType } from "@/lib/pricing";
import { assertTimeSlotIsBookable } from "@/lib/timeSlotAvailability";

type BookingRequestBody = {
  setup_id?: string;
  time_slot_id?: string;
  session_type_id?: string;
  booking_date?: string;
  calendar_event_id?: string;
};

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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

    const body = (await request.json()) as BookingRequestBody;
    const { setup_id, time_slot_id, session_type_id, booking_date, calendar_event_id } = body;

    if (!time_slot_id || !session_type_id || !isValidDate(booking_date)) {
      return NextResponse.json({ error: "Missing booking details" }, { status: 400 });
    }

    const { data: sessionType, error: sessionError } = await supabase
      .from("session_types")
      .select("id, name, max_players, price_per_hour, price_multiplier, h_coins_earned")
      .eq("id", session_type_id)
      .single();

    if (sessionError || !sessionType) {
      return NextResponse.json({ error: "Invalid session type" }, { status: 400 });
    }

    const isAllAccess = sessionType.name && sessionType.name.startsWith("All-Access");

    let setup: any = null;
    if (!isAllAccess) {
      if (!setup_id) return NextResponse.json({ error: "Missing setup selection" }, { status: 400 });

      const { data: setupData, error: setupError } = await supabase
        .from("setups")
        .select("id, name, display_name, base_price, max_players, is_active")
        .eq("id", setup_id)
        .eq("is_active", true)
        .single();

      if (setupError || !setupData) {
        return NextResponse.json({ error: "Invalid setup" }, { status: 400 });
      }

      setup = setupData;

      if (setup.name === "racing") {
        if (!isRacingSessionType(sessionType.name)) {
          return NextResponse.json({ error: "Session type is not available for this setup" }, { status: 400 });
        }
      } else if (sessionType.max_players > setup.max_players) {
        return NextResponse.json({ error: "Session type is not available for this setup" }, { status: 400 });
      }
    }

    const { data: timeSlot, error: slotError } = await supabase
      .from("time_slots")
      .select("id")
      .eq("id", time_slot_id)
      .single();

    if (slotError || !timeSlot) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    const availability = await assertTimeSlotIsBookable(supabase, booking_date, time_slot_id);
    if (!availability.allowed) {
      return NextResponse.json({ error: availability.message }, { status: 400 });
    }

    let totalPrice: number;
    let durationMinutes: number | null = null;

    if (isAllAccess) {
      // Use session type price directly for All-Access
      totalPrice = sessionType.price_per_hour ?? 0;
      durationMinutes = sessionType.name.includes("30min") ? 30 : 60;
    } else {
      const { data: dynamicPriceSetting } = await supabase
        .from("price_settings")
        .select("current_price")
        .eq("setup_id", setup.id)
        .eq("session_type_id", session_type_id)
        .single();

      totalPrice =
        typeof dynamicPriceSetting?.current_price === "number"
          ? dynamicPriceSetting.current_price
          : calculateBookingPrice(setup, sessionType);
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        setup_id: isAllAccess ? null : setup?.id,
        time_slot_id,
        session_type_id,
        booking_date,
        player_count: sessionType.max_players,
        duration_minutes: durationMinutes,
        total_price: totalPrice,
        calendar_event_id,
        status: "confirmed",
      })
      .select("*, setups(*), time_slots(*), session_types(*)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
      }

      console.error("Booking error:", error);
      return NextResponse.json({ error: "Booking failed" }, { status: 500 });
    }

    if (totalPrice > 0 && sessionType.h_coins_earned > 0) {
      const { error: ledgerError } = await supabase
        .from("h_coin_ledger")
        .insert({
          user_id: user.id,
          amount: sessionType.h_coins_earned,
          type: "earn",
          reference_id: data.id,
          description: `Booking completed: ${data.booking_code}`,
        });

      if (ledgerError) {
        console.error("Ledger error:", ledgerError);
      }
    }

    if (!isAllAccess && setup) {
      await supabase.from("setup_status").upsert({
        setup_id: setup.id,
        status: "booked",
        current_booking_id: data.id,
        updated_at: new Date().toISOString(),
      });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, email, display_name, h_id")
      .eq("id", user.id)
      .single();

    const bookingForEmail = {
      ...data,
      users: profile ?? {
        id: user.id,
        email: user.email ?? "",
        display_name: user.user_metadata?.display_name ?? user.email ?? undefined,
        h_id: undefined,
      },
    };

    console.log("[Booking] Sending emails for booking:", data.booking_code);

    const [customerEmailResult, adminEmailResult] = await Promise.all([
      sendBookingConfirmationEmail(bookingForEmail).catch((err) => {
        console.error("[Booking] Failed to send customer email:", err);
        return false;
      }),
      sendAdminAlertEmail(bookingForEmail).catch((err) => {
        console.error("[Booking] Failed to send admin email:", err);
        return false;
      }),
    ]);

    console.log("Customer email result:", customerEmailResult ? "Sent" : "Failed");
    console.log("Admin email result:", adminEmailResult ? "Sent" : "Failed");

    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
