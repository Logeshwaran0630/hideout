import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type BookingRow = {
  booking_date: string;
  total_price: number | null;
  payment_status: string | null;
  payment_mode: string | null;
  is_walkin: boolean | null;
  setups: { display_name: string | null } | { display_name: string | null }[] | null;
};

function isAdminUser(userId: string, supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  return supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()
    .then(({ data }) => data?.role === "admin");
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(startDate: string, endDate: string) {
  const days: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    days.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isAdminUser(user.id, supabase);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date required" }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json({ error: "Start date cannot be after end date" }, { status: 400 });
    }

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_code,
        booking_date,
        total_price,
        payment_status,
        payment_mode,
        paid_at,
        is_walkin,
        guest_name,
        users (display_name, email, h_id),
        time_slots (label, start_time, end_time),
        setups (display_name),
        session_types (name, h_coins_earned)
      `)
      .gte("booking_date", startDate)
      .lte("booking_date", endDate)
      .order("booking_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bookingRows = (bookings ?? []) as BookingRow[];

    const totalRevenue = bookingRows.reduce((sum, booking) => {
      return booking.payment_status === "paid" ? sum + (booking.total_price ?? 0) : sum;
    }, 0);

    const cashTotal = bookingRows.reduce((sum, booking) => {
      return booking.payment_status === "paid" && booking.payment_mode === "cash"
        ? sum + (booking.total_price ?? 0)
        : sum;
    }, 0);

    const upiTotal = bookingRows.reduce((sum, booking) => {
      return booking.payment_status === "paid" && booking.payment_mode === "upi"
        ? sum + (booking.total_price ?? 0)
        : sum;
    }, 0);

    const pendingAmount = bookingRows.reduce((sum, booking) => {
      return booking.payment_status === "pending" ? sum + (booking.total_price ?? 0) : sum;
    }, 0);

    const totalBookings = bookingRows.length;
    const paidBookings = bookingRows.filter((booking) => booking.payment_status === "paid").length;
    const pendingBookings = bookingRows.filter((booking) => booking.payment_status === "pending").length;
    const walkinBookings = bookingRows.filter((booking) => booking.is_walkin).length;

    const dailyMap: Record<string, {
      date: string;
      dayName: string;
      bookings: number;
      revenue: number;
      cash: number;
      upi: number;
      pending: number;
    }> = {};

    for (const date of buildDateRange(startDate, endDate)) {
      dailyMap[date] = {
        date,
        dayName: new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" }),
        bookings: 0,
        revenue: 0,
        cash: 0,
        upi: 0,
        pending: 0,
      };
    }

    for (const booking of bookingRows) {
      const date = toDateKey(booking.booking_date);
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          dayName: new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" }),
          bookings: 0,
          revenue: 0,
          cash: 0,
          upi: 0,
          pending: 0,
        };
      }

      dailyMap[date].bookings += 1;
      if (booking.payment_status === "paid") {
        dailyMap[date].revenue += booking.total_price ?? 0;
        if (booking.payment_mode === "cash") dailyMap[date].cash += booking.total_price ?? 0;
        if (booking.payment_mode === "upi") dailyMap[date].upi += booking.total_price ?? 0;
      } else {
        dailyMap[date].pending += booking.total_price ?? 0;
      }
    }

    const setupMap: Record<string, { name: string; bookings: number; revenue: number }> = {};
    for (const booking of bookingRows) {
      const setupRelation = booking.setups;
      const setupName = Array.isArray(setupRelation) ? setupRelation[0]?.display_name : setupRelation?.display_name;
      const name = setupName || "Unknown";

      if (!setupMap[name]) {
        setupMap[name] = { name, bookings: 0, revenue: 0 };
      }

      setupMap[name].bookings += 1;
      if (booking.payment_status === "paid") {
        setupMap[name].revenue += booking.total_price ?? 0;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        startDate,
        endDate,
        totalRevenue,
        cashTotal,
        upiTotal,
        pendingAmount,
        totalBookings,
        paidBookings,
        pendingBookings,
        walkinBookings,
      },
      dailyBreakdown: Object.values(dailyMap),
      setupPopularity: Object.values(setupMap).sort((a, b) => b.revenue - a.revenue),
      paymentDistribution: {
        cash: cashTotal,
        upi: upiTotal,
        pending: pendingAmount,
      },
      bookings: bookingRows,
    });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}