import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimeSlotManagement from "@/components/admin/TimeSlotManagement";

export default async function TimeSlotsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") redirect("/profile");

  return <TimeSlotManagement />;
}