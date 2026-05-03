import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (user.email?.toLowerCase() !== "admin@hideout.com") {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      users (h_id, display_name, email),
      time_slots (label),
      session_types (name)
    `)
    .order("created_at", { ascending: false });

  return NextResponse.json({ bookings: bookings ?? [] });
}
