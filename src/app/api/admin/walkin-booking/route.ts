import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { assertTimeSlotIsBookable } from "@/lib/timeSlotAvailability";

type WalkInRequestBody = {
  customerName?: string;
  customerPhone?: string;
  setupId?: string;
  sessionTypeId?: string;
  timeSlotId?: string;
  bookingDate?: string;
  totalPrice?: number;
  paymentMode?: string;
};

function buildDateTime(date: string, time: string) {
  const [hours, minutes] = time.split(":");
  const value = new Date(date);
  value.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return value;
}

async function isAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as WalkInRequestBody;
    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim() || null;

    if (!customerName || !body.setupId || !body.sessionTypeId || !body.timeSlotId || !body.bookingDate) {
      return NextResponse.json({ error: "Missing booking details" }, { status: 400 });
    }

    const [{ data: setup }, { data: sessionType }, { data: timeSlot }] = await Promise.all([
      supabase.from("setups").select("id, display_name").eq("id", body.setupId).single(),
      supabase.from("session_types").select("id, name, max_players, price_per_hour").eq("id", body.sessionTypeId).single(),
      supabase.from("time_slots").select("id, label, start_time, end_time").eq("id", body.timeSlotId).single(),
    ]);

    if (!setup || !sessionType || !timeSlot) {
      return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
    }

    const availability = await assertTimeSlotIsBookable(supabase, body.bookingDate, body.timeSlotId);
    if (!availability.allowed) {
      return NextResponse.json({ error: availability.message }, { status: 400 });
    }

    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_date", body.bookingDate)
      .eq("time_slot_id", body.timeSlotId)
      .eq("setup_id", body.setupId)
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({ error: "Selected setup and time slot are already booked" }, { status: 409 });
    }

    const tempEmail = `walkin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@hideout.local`;
    const tempPassword = crypto.randomUUID();

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        display_name: customerName,
        phone: customerPhone,
        is_walkin: true,
      },
    });

    if (createUserError || !createdUser.user) {
      return NextResponse.json({ error: createUserError?.message || "Unable to create walk-in customer" }, { status: 500 });
    }

    await supabase.from("users").upsert({
      id: createdUser.user.id,
      email: tempEmail,
      display_name: customerName,
      phone: customerPhone,
      role: "user",
    });

    const startDateTime = buildDateTime(body.bookingDate, timeSlot.start_time);
    const endDateTime = buildDateTime(body.bookingDate, timeSlot.end_time);
    const calendarEventId = await createCalendarEvent({
      summary: `Walk-in: ${customerName} (${setup.display_name})`,
      description: `Walk-in booking\nCustomer: ${customerName}\nPhone: ${customerPhone || "-"}\nSession: ${sessionType.name}`,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });

    const totalPrice = body.totalPrice ?? sessionType.price_per_hour ?? 0;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: createdUser.user.id,
        setup_id: body.setupId,
        time_slot_id: body.timeSlotId,
        session_type_id: body.sessionTypeId,
        booking_date: body.bookingDate,
        player_count: sessionType.max_players,
        total_price: totalPrice,
        calendar_event_id: calendarEventId,
        payment_status: "paid",
        payment_mode: body.paymentMode || "cash",
        paid_at: new Date().toISOString(),
        status: "confirmed",
        is_walkin: true,
        guest_name: customerName,
        guest_phone: customerPhone,
      })
      .select("id, booking_code, booking_date")
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: bookingError?.message || "Failed to create booking" }, { status: 500 });
    }

    await supabase.from("setup_status").upsert({
      setup_id: body.setupId,
      status: "booked",
      current_booking_id: booking.id,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      booking: {
        code: booking.booking_code,
        customerName,
        customerPhone,
        date: booking.booking_date,
        time: timeSlot.label,
        setup: setup.display_name,
        session: sessionType.name,
        amount: totalPrice,
        paymentMode: body.paymentMode || "cash",
      },
    });
  } catch (error) {
    console.error("Walk-in API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
