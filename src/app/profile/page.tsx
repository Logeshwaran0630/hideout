import ProfileClient from "@/components/ProfileClient";
import { sendWelcomeEmail } from "@/lib/email";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, h_id, display_name, role, created_at")
    .eq("id", user.id)
    .single();

  if (profile) {
    return <ProfileClient profile={profile} />;
  }

  // Prefer calling RPC that safely creates a profile using the DB sequence.
  // If the RPC/function is not present, fall back to inserting the row
  // without touching `h_id` so the DB trigger (if present) can set it.
  try {
    await supabase.rpc("ensure_user_profile", {
      p_user_id: user.id,
      p_email: user.email!,
    });
  } catch (e) {
    // If RPC isn't available, do a best-effort insert without touching `h_id`.
    try {
      await supabase.from("users").insert({
        id: user.id,
        email: user.email ?? "",
        display_name: user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? null,
        role: "user",
      });
    } catch (e) {
      // ignore conflicts or missing permissions — we'll attempt to read the row below
    }
  }

  const { data: newProfile } = await supabase
    .from("users")
    .select("id, email, h_id, display_name, role, created_at")
    .eq("id", user.id)
    .single();

  if (newProfile?.email) {
    const profileWasCreated = !profile;
    if (profileWasCreated) {
      await sendWelcomeEmail({
        id: newProfile.id,
        email: newProfile.email,
        display_name: newProfile.display_name,
        h_id: newProfile.h_id,
      });
    }
  }

  const fallbackProfile = {
    id: user.id,
    email: user.email ?? "",
    h_id: (newProfile as any)?.h_id ?? null,
    display_name: user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? null,
    created_at: user.created_at ?? new Date().toISOString(),
    role: (newProfile as any)?.role ?? "user",
  };

  return <ProfileClient profile={(newProfile as any) ?? fallbackProfile} />;
}
