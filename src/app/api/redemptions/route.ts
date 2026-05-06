import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RedemptionRequestBody = {
  booking_date?: string;
  time_slot_id?: string;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isMissingRpc(error: SupabaseError | null) {
  return error?.code === "PGRST202" || error?.message?.toLowerCase().includes("could not find the function");
}

function redemptionErrorResponse(error: SupabaseError | null) {
  if (!error) return null;

  if (error.code === "23505") {
    return NextResponse.json({ error: "This slot was just booked. Please choose another time." }, { status: 409 });
  }

  if (error.message?.includes("Insufficient")) {
    return NextResponse.json({ error: "You don't have enough H Coins for this redemption." }, { status: 409 });
  }

  if (error.message?.includes("24 hours")) {
    return NextResponse.json({ error: "Free sessions must be booked at least 24 hours in advance." }, { status: 400 });
  }

  return null;
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

    const body = (await request.json()) as RedemptionRequestBody;
    const { booking_date, time_slot_id } = body;

    if (!time_slot_id || !isValidDate(booking_date)) {
      return NextResponse.json({ error: "Missing redemption details" }, { status: 400 });
    }

    if (booking_date <= todayString()) {
      return NextResponse.json({ error: "Free sessions must be booked at least 24 hours in advance." }, { status: 400 });
    }

    const rpcResult = await supabase
      .rpc("redeem_free_session", {
        p_booking_date: booking_date,
        p_time_slot_id: time_slot_id,
      })
      .single();

    if (!rpcResult.error) {
      return NextResponse.json({ success: true, booking: rpcResult.data });
    }

    const mappedRpcError = redemptionErrorResponse(rpcResult.error);
    if (mappedRpcError) return mappedRpcError;

    if (!isMissingRpc(rpcResult.error)) {
      console.error("Redemption RPC error:", rpcResult.error);
      return NextResponse.json({ error: "Redemption failed. Please try again." }, { status: 500 });
    }

    const { data: ledger, error: ledgerReadError } = await supabase
      .from("h_coin_ledger")
      .select("amount")
      .eq("user_id", user.id);

    if (ledgerReadError) {
      console.error("Redemption balance error:", ledgerReadError);
      return NextResponse.json({ error: "Could not check H Coins balance." }, { status: 500 });
    }

    const balance = (ledger ?? []).reduce((sum, row) => sum + row.amount, 0);
    if (balance < 100) {
      return NextResponse.json({ error: "You don't have enough H Coins for this redemption." }, { status: 409 });
    }

    let freeSession = await supabase
      .from("session_types")
      .select("id")
      .eq("name", "Free Session")
      .single();

    if (freeSession.error || !freeSession.data) {
      const created = await supabase
        .from("session_types")
        .insert({
          name: "Free Session",
          max_players: 1,
          price_per_hour: 0,
          description: "Redeemed with 100 H Coins - 1 hour free play",
          h_coins_earned: 0,
          sort_order: 4,
        })
        .select("id")
        .single();

      freeSession = created;
    }

    if (freeSession.error || !freeSession.data) {
      console.error("Free session setup error:", freeSession.error);
      return NextResponse.json(
        { error: "Free Session is not set up in Supabase. Run the updated SQL setup, then try again." },
        { status: 500 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        time_slot_id,
        session_type_id: freeSession.data.id,
        booking_date,
        player_count: 1,
        total_price: 0,
        status: "confirmed",
      })
      .select("id, booking_code, booking_date, total_price, time_slot_id, session_type_id")
      .single();

    if (bookingError) {
      const mappedBookingError = redemptionErrorResponse(bookingError);
      if (mappedBookingError) return mappedBookingError;

      console.error("Redemption booking error:", bookingError);
      return NextResponse.json({ error: "Redemption booking failed. Please try again." }, { status: 500 });
    }

    const { error: redeemLedgerError } = await supabase
      .from("h_coin_ledger")
      .insert({
        user_id: user.id,
        amount: -100,
        type: "redeem",
        reference_id: booking.id,
        description: `Redeemed 100 coins for free session: ${booking.booking_code}`,
      });

    if (redeemLedgerError) {
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);

      const mappedLedgerError = redemptionErrorResponse(redeemLedgerError);
      if (mappedLedgerError) return mappedLedgerError;

      console.error("Redemption ledger error:", redeemLedgerError);
      return NextResponse.json({ error: "Could not deduct H Coins. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Redemption error:", error);
    return NextResponse.json({ error: "Redemption failed. Please try again." }, { status: 500 });
  }
}
