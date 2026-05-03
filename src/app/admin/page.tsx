import { createServerSupabaseClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/admin/DashboardClient";
import { redirect } from "next/navigation";

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

  const { data: stats } = await supabase
    .from("admin_booking_stats")
    .select("*")
    .single();

  const { data: todaysBookings } = await supabase
    .from("bookings")
    .select(`*, users(h_id, display_name, email), time_slots(label), session_types(name, price_per_hour)`)
    .eq("booking_date", new Date().toISOString().split("T")[0])
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const { data: recentBookings } = await supabase
    .from("bookings")
    .select(`*, users(h_id, display_name, email), time_slots(label), session_types(name)`)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <DashboardClient
      stats={stats ?? {
        total_confirmed: 0,
        total_cancelled: 0,
        total_completed: 0,
        todays_bookings: 0,
        total_revenue: 0,
        todays_revenue: 0,
      }}
      todaysBookings={todaysBookings ?? []}
      recentBookings={recentBookings ?? []}
    />
  );
}
