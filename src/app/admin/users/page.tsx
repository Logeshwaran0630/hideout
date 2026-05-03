import { createServerSupabaseClient } from "@/lib/supabase/server";
import UsersClient from "@/components/admin/UsersClient";

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  const { data: bookingCounts } = await supabase.from("bookings").select("user_id, status");
  const { data: coinLedger } = await supabase.from("h_coin_ledger").select("user_id, amount");

  return <UsersClient users={users ?? []} bookingCounts={bookingCounts ?? []} coinLedger={coinLedger ?? []} />;
}
