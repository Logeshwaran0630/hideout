import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CheckInBody = {
  bookingId?: string;
  setupId?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminCheck } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (adminCheck?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as CheckInBody;
    if (!body.bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase.from("bookings").select("id, setup_id").eq("id", body.bookingId).single();
    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        check_in_status: "arrived",
        check_in_time: new Date().toISOString(),
      })
      .eq("id", body.bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const setupId = body.setupId || booking.setup_id;
    if (setupId) {
      await supabase.from("setup_status").upsert({
        setup_id: setupId,
        status: "occupied",
        current_booking_id: body.bookingId,
        occupied_since: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
