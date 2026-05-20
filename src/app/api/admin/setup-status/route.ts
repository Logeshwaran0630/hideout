import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: setupsToSeed } = await supabase.from("setups").select("id");
    if (Array.isArray(setupsToSeed) && setupsToSeed.length > 0) {
      await supabase.from("setup_status").upsert(
        setupsToSeed.map((setup) => ({
          setup_id: setup.id,
          status: "available",
          updated_at: new Date().toISOString(),
        }))
      );
    }

    const { data, error } = await supabase
      .from("setup_status")
      .select(`
        id,
        setup_id,
        status,
        current_booking_id,
        occupied_since,
        updated_at,
        setups (id, name, display_name, badge)
      `)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ setups: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
