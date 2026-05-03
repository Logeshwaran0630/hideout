import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingsClient from "@/components/admin/BookingsClient";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { date?: string; status?: string; search?: string };
}) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("bookings")
    .select(`
      *,
      users (h_id, display_name, email),
      time_slots (label, start_time),
      session_types (name, price_per_hour)
    `)
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (searchParams.date) query = query.eq("booking_date", searchParams.date);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: rawBookings } = await query.limit(100);
  const normalizedSearch = searchParams.search?.trim().toLowerCase() || "";
  const bookings = normalizedSearch
    ? (rawBookings ?? []).filter((booking) => {
        const haystack = [
          booking.booking_code,
          booking.users?.h_id,
          booking.users?.display_name,
          booking.users?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : (rawBookings ?? []);

  return <BookingsClient bookings={bookings} filters={searchParams} />;
}
