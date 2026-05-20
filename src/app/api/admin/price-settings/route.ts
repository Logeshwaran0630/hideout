import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SaleSettings = {
  enabled?: boolean;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  start_date?: string | null;
  end_date?: string | null;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundPrice(value: number) {
  return Math.max(0, Math.round(value));
}

function applySaleToPrice(basePrice: number, sale: SaleSettings) {
  if (!sale.enabled || !sale.discount_value || sale.discount_value <= 0) {
    return roundPrice(basePrice);
  }

  if (sale.discount_type === "fixed") {
    return roundPrice(basePrice - sale.discount_value);
  }

  return roundPrice(basePrice * (1 - sale.discount_value / 100));
}

async function isAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, supabase };
  }

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminUser?.role !== "admin") {
    return { ok: false as const, status: 403, supabase };
  }

  return { ok: true as const, supabase };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: priceSettings, error: priceError } = await supabase
      .from("price_settings")
      .select(
        `
          id,
          base_price,
          current_price,
          is_sale,
          discount_percentage,
          sale_start_date,
          sale_end_date,
          setups (id, name, display_name, sort_order),
          session_types (id, name, sort_order)
        `
      );

    if (priceError) {
      return NextResponse.json({ error: priceError.message }, { status: 500 });
    }

    const sortedPriceSettings = (priceSettings ?? []).sort((a: any, b: any) => {
      const setupA = a?.setups?.sort_order ?? 999;
      const setupB = b?.setups?.sort_order ?? 999;
      const sessionA = a?.session_types?.sort_order ?? 999;
      const sessionB = b?.session_types?.sort_order ?? 999;
      if (setupA !== setupB) return setupA - setupB;
      return sessionA - sessionB;
    });

    const { data: globalSettings, error: globalError } = await supabase
      .from("global_settings")
      .select("key, value");

    if (globalError) {
      return NextResponse.json({ error: globalError.message }, { status: 500 });
    }

    const hCoinsSettings = globalSettings?.find((g: any) => g.key === "h_coins")?.value || {};
    const saleSettings = globalSettings?.find((g: any) => g.key === "sale_settings")?.value || {};

    return NextResponse.json({
      success: true,
      priceSettings: sortedPriceSettings,
      hCoinsSettings,
      saleSettings,
    });
  } catch (error) {
    console.error("Price settings API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await isAdmin();
    if (!admin.ok) {
      const message = admin.status === 401 ? "Unauthorized" : "Forbidden";
      return NextResponse.json({ error: message }, { status: admin.status });
    }

    const { supabase } = admin;
    const body = await request.json();
    const { type, data } = body as { type?: string; data?: any };

    if (type === "price_update") {
      const priceSettingId = String(data?.priceSettingId || "");
      const newPrice = toNumber(data?.newPrice, -1);

      if (!priceSettingId || newPrice < 0) {
        return NextResponse.json({ error: "Invalid price update payload" }, { status: 400 });
      }

      const { data: saleRow } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "sale_settings")
        .single();

      const saleSettings = (saleRow?.value ?? {}) as SaleSettings;
      const updatedBasePrice = roundPrice(newPrice);
      const updatedCurrentPrice = applySaleToPrice(updatedBasePrice, saleSettings);

      const { error: updateError } = await supabase
        .from("price_settings")
        .update({
          base_price: updatedBasePrice,
          current_price: updatedCurrentPrice,
          is_sale: Boolean(saleSettings.enabled),
          discount_percentage: saleSettings.enabled && saleSettings.discount_type === "percentage"
            ? toNumber(saleSettings.discount_value, 0)
            : null,
          sale_start_date: saleSettings.enabled ? saleSettings.start_date ?? null : null,
          sale_end_date: saleSettings.enabled ? saleSettings.end_date ?? null : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", priceSettingId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (type === "sale_update") {
      const saleSettings: SaleSettings = {
        enabled: Boolean(data?.enabled),
        discount_type: data?.discountType === "fixed" ? "fixed" : "percentage",
        discount_value: Math.max(0, toNumber(data?.discountValue, 0)),
        start_date: data?.startDate || null,
        end_date: data?.endDate || null,
      };

      const { error: updateSaleError } = await supabase
        .from("global_settings")
        .update({
          value: saleSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("key", "sale_settings");

      if (updateSaleError) {
        return NextResponse.json({ error: updateSaleError.message }, { status: 500 });
      }

      const { data: settingsRows, error: rowsError } = await supabase
        .from("price_settings")
        .select("id, base_price");

      if (rowsError) {
        return NextResponse.json({ error: rowsError.message }, { status: 500 });
      }

      const now = new Date().toISOString();
      for (const row of settingsRows ?? []) {
        const nextPrice = applySaleToPrice(row.base_price, saleSettings);
        await supabase
          .from("price_settings")
          .update({
            current_price: nextPrice,
            is_sale: Boolean(saleSettings.enabled),
            discount_percentage: saleSettings.enabled && saleSettings.discount_type === "percentage"
              ? toNumber(saleSettings.discount_value, 0)
              : null,
            sale_start_date: saleSettings.enabled ? saleSettings.start_date ?? null : null,
            sale_end_date: saleSettings.enabled ? saleSettings.end_date ?? null : null,
            updated_at: now,
          })
          .eq("id", row.id);
      }

      return NextResponse.json({ success: true });
    }

    if (type === "cancel_sale") {
      const { data: settingsRows, error: rowsError } = await supabase
        .from("price_settings")
        .select("id, base_price");

      if (rowsError) {
        return NextResponse.json({ error: rowsError.message }, { status: 500 });
      }

      const now = new Date().toISOString();
      for (const row of settingsRows ?? []) {
        await supabase
          .from("price_settings")
          .update({
            current_price: row.base_price,
            is_sale: false,
            discount_percentage: null,
            sale_start_date: null,
            sale_end_date: null,
            updated_at: now,
          })
          .eq("id", row.id);
      }

      const disabledSaleSettings: SaleSettings = {
        enabled: false,
        discount_type: "percentage",
        discount_value: 0,
        start_date: null,
        end_date: null,
      };

      const { error: updateSaleError } = await supabase
        .from("global_settings")
        .update({
          value: disabledSaleSettings,
          updated_at: now,
        })
        .eq("key", "sale_settings");

      if (updateSaleError) {
        return NextResponse.json({ error: updateSaleError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (type === "h_coins_update") {
      const coinsPerSolo = Math.max(0, toNumber(data?.coinsPerSolo, 0));
      const coinsPerDuo = Math.max(0, toNumber(data?.coinsPerDuo, 0));
      const coinsPerSquad = Math.max(0, toNumber(data?.coinsPerSquad, 0));
      const coinsForFreeSession = Math.max(0, toNumber(data?.coinsForFreeSession, 0));

      const hCoinsSettings = {
        coins_per_solo: coinsPerSolo,
        coins_per_duo: coinsPerDuo,
        coins_per_squad: coinsPerSquad,
        coins_for_free_session: coinsForFreeSession,
      };

      const { error: globalUpdateError } = await supabase
        .from("global_settings")
        .update({
          value: hCoinsSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("key", "h_coins");

      if (globalUpdateError) {
        return NextResponse.json({ error: globalUpdateError.message }, { status: 500 });
      }

      await supabase.from("session_types").update({ h_coins_earned: coinsPerSolo }).eq("name", "Solo");
      await supabase.from("session_types").update({ h_coins_earned: coinsPerDuo }).eq("name", "Duo");
      await supabase.from("session_types").update({ h_coins_earned: coinsPerSquad }).eq("name", "Squad");

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
  } catch (error) {
    console.error("Price settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
