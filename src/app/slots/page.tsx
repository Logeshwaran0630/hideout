import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingWizard from "@/components/BookingWizard";

export default async function SlotsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/slots");

  let { data: sessionTypes, error: sessionTypesError } = await supabase
    .from("session_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (sessionTypesError) {
    const fallback = await supabase
      .from("session_types")
      .select("*")
      .order("price_per_hour", { ascending: true });

    sessionTypes = fallback.data;
    sessionTypesError = fallback.error;
  }

  const { data: setups } = await supabase
    .from("setups")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: profile } = await supabase
    .from("users")
    .select("id, h_id, display_name, email, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0A0F18] pt-18">
      <BookingWizard
        setups={setups || []}
        sessionTypes={sessionTypes || []}
        user={{ id: user.id, email: user.email! }}
        profile={profile}
      />
    </div>
  );
}
