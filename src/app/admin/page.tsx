import { createServerSupabaseClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/admin/DashboardClient";
import { redirect } from "next/navigation";

type DashboardStats = {
  todayRevenue: number;
  pendingAmount: number;
  completedCount: number;
  cashTotal: number;
  upiTotal: number;
};

function sumPrices(rows: Array<{ total_price: number | null }>) {
  return rows.reduce((total, row) => total + (row.total_price ?? 0), 0);
}

async function getDashboardData(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todayPaidResult,
    pendingResult,
    completedCountResult,
    cashResult,
    upiResult,
    todaysBookingsResult,
    recentBookingsResult,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("total_price")
      .eq("payment_status", "paid")
      .gte("paid_at", today.toISOString())
      .lt("paid_at", tomorrow.toISOString()),
    supabase
      .from("bookings")
      .select("total_price")
      .eq("payment_status", "pending")
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid"),
    supabase
      .from("bookings")
      .select("total_price")
      .eq("payment_status", "paid")
      .eq("payment_mode", "cash"),
    supabase
      .from("bookings")
      .select("total_price")
      .eq("payment_status", "paid")
      .eq("payment_mode", "upi"),
    supabase
      .from("bookings")
      .select(`
        *,
        setups (display_name),
        users (h_id, display_name, email),
        time_slots (label),
        session_types (name)
      `)
      .eq("booking_date", today.toISOString().split("T")[0])
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select(`
        *,
        setups (display_name),
        users (h_id, display_name, email),
        time_slots (label),
        session_types (name)
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats: DashboardStats = {
    todayRevenue: sumPrices(todayPaidResult.data ?? []),
    pendingAmount: sumPrices(pendingResult.data ?? []),
    completedCount: completedCountResult.count ?? 0,
    cashTotal: sumPrices(cashResult.data ?? []),
    upiTotal: sumPrices(upiResult.data ?? []),
  };

  return {
    stats,
    todaysBookings: todaysBookingsResult.data ?? [],
    recentBookings: recentBookingsResult.data ?? [],
  };
}

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email?.toLowerCase() !== "admin@hideout.com") {
    redirect("/profile");
  }

  const { stats, todaysBookings, recentBookings } = await getDashboardData(supabase);
  const cashTotal = stats.cashTotal || 0;
  const upiTotal = stats.upiTotal || 0;

  return (
    <DashboardClient
      stats={stats}
      cashTotal={cashTotal}
      upiTotal={upiTotal}
      todaysBookings={todaysBookings}
      recentBookings={recentBookings}
    />
  );
}
