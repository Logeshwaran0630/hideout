import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendAdminAlertEmail, sendBookingConfirmationEmail } from "@/lib/email";

type BookingRequestBody = {
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
    const { time_slot_id, session_type_id, booking_date, calendar_event_id } = body;

    if (!time_slot_id || !session_type_id || !isValidDate(booking_date)) {
      return NextResponse.json({ error: "Missing booking details" }, { status: 400 });
    }

    const { data: sessionType, error: sessionError } = await supabase
      .from("session_types")
      .select("id, max_players, price_per_hour")
      .eq("id", session_type_id)
      .single();

    if (sessionError || !sessionType) {
      return NextResponse.json({ error: "Invalid session type" }, { status: 400 });
    }

    const { data: timeSlot, error: slotError } = await supabase
      .from("time_slots")
      .select("id")
      .eq("id", time_slot_id)
      .single();

    if (slotError || !timeSlot) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        time_slot_id,
        session_type_id,
        booking_date,
        player_count: sessionType.max_players,
        total_price: sessionType.price_per_hour,
        calendar_event_id,
        status: "confirmed",
      })
      .select("*, time_slots(*), session_types(*)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
      }

      console.error("Booking error:", error);
      return NextResponse.json({ error: "Booking failed" }, { status: 500 });
    }

    // ✅ Manually award H Coins (no trigger)
    const { data: sessionTypeData } = await supabase
      .from("session_types")
      .select("h_coins_earned, price_per_hour")
      .eq("id", session_type_id)
      .single();

    if (sessionTypeData && sessionTypeData.price_per_hour > 0 && sessionTypeData.h_coins_earned > 0) {
      const { error: ledgerError } = await supabase
        .from("h_coin_ledger")
        .insert({
          user_id: user.id,
          amount: sessionTypeData.h_coins_earned,
          type: "earn",
          reference_id: data.id,
          description: `Booking completed: ${data.booking_code}`,
        });

      if (ledgerError) {
        console.error("Ledger error:", ledgerError);
        // Don't fail the booking if ledger fails
      }
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

    console.log("📧 [Booking] Sending emails for booking:", data.booking_code);

    const [customerEmailResult, adminEmailResult] = await Promise.all([
      sendBookingConfirmationEmail(bookingForEmail).catch((err) => {
        console.error("❌ [Booking] Failed to send customer email:", err);
        return false;
      }),
      sendAdminAlertEmail(bookingForEmail).catch((err) => {
        console.error("❌ [Booking] Failed to send admin email:", err);
        return false;
      }),
    ]);

    console.log("📧 Customer email result:", customerEmailResult ? "✅ Sent" : "❌ Failed");
    console.log("📧 Admin email result:", adminEmailResult ? "✅ Sent" : "❌ Failed");

    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
