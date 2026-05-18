import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RequestBody = {
  bookingId?: string;
  paymentMode?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("role, display_name, email")
      .eq("id", user.id)
      .single();

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as RequestBody;
    const paymentMode = body.paymentMode?.toLowerCase();

    if (!body.bookingId || !paymentMode || !["cash", "upi"].includes(paymentMode)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, payment_status")
      .eq("id", body.bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({ error: "Booking is already marked as paid" }, { status: 409 });
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        payment_mode: paymentMode,
        paid_at: new Date().toISOString(),
        collected_by: adminUser?.display_name || adminUser?.email || user.email || "Admin",
      })
      .eq("id", body.bookingId)
      .select("id, booking_code, payment_status, payment_mode, paid_at, collected_by")
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Mark paid error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}