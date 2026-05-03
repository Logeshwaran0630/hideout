import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingWizard from "@/components/BookingWizard";

export default async function SlotsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/slots");

  const { data: sessionTypes } = await supabase
    .from("session_types")
    .select("*")
    .order("price_per_hour", { ascending: true });

  const { data: profile } = await supabase
    .from("users")
    .select("id, h_id, display_name, email, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#09090B] pt-18">
      <BookingWizard
        sessionTypes={sessionTypes || []}
        user={{ id: user.id, email: user.email! }}
        profile={profile}
      />
    </div>
  );
}
