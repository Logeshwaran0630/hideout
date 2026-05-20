import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type WaitlistBody = {
  customerName?: string;
  customerPhone?: string;
  preferredSetup?: string;
  partySize?: number;
  notes?: string;
  waitlistId?: string;
  status?: string;
};

async function isAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.from("waitlist").select("*").eq("status", "waiting").order("added_at", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ waitlist: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as WaitlistBody;
    if (!body.customerName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        customer_name: body.customerName,
        customer_phone: body.customerPhone ?? null,
        preferred_setup: body.preferredSetup ?? null,
        party_size: body.partySize ?? 1,
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, waitlistEntry: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as WaitlistBody;
    if (!body.waitlistId || !body.status) {
      return NextResponse.json({ error: "Missing waitlist update details" }, { status: 400 });
    }

    const update: Record<string, string | null> = { status: body.status };
    if (body.status === "notified") {
      update.notified_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("waitlist")
      .update(update)
      .eq("id", body.waitlistId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, waitlistEntry: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
