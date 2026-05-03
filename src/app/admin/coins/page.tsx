import { createServerSupabaseClient } from "@/lib/supabase/server";
import CoinsClient from "@/components/admin/CoinsClient";

export default async function AdminCoinsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: ledger } = await supabase
    .from("h_coin_ledger")
    .select(`
      *,
      users (h_id, display_name, email),
      bookings (booking_code)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: allLedger } = await supabase.from("h_coin_ledger").select("amount, type");
  const totalEarned = allLedger?.filter((row) => row.type === "earn").reduce((sum, row) => sum + row.amount, 0) || 0;
  const totalRedeemed = Math.abs(allLedger?.filter((row) => row.type === "redeem").reduce((sum, row) => sum + row.amount, 0) || 0);

  return <CoinsClient ledger={ledger ?? []} totalEarned={totalEarned} totalRedeemed={totalRedeemed} />;
}
