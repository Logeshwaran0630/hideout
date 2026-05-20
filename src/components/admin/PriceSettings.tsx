"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Percent, Save, Tag, XCircle } from "lucide-react";

type PriceSetting = {
  id: string;
  base_price: number;
  current_price: number;
  setups?: { id: string; name: string; display_name: string };
  session_types?: { id: string; name: string };
};

type MessageState = { type: "success" | "error"; text: string } | null;

export default function PriceSettings() {
  const [priceSettings, setPriceSettings] = useState<PriceSetting[]>([]);
  const [pendingPrices, setPendingPrices] = useState<Record<string, number>>({});
  const [hCoinsSettings, setHCoinsSettings] = useState({
    coins_per_solo: 10,
    coins_per_duo: 15,
    coins_per_squad: 25,
    coins_for_free_session: 100,
  });
  const [saleSettings, setSaleSettings] = useState({
    enabled: false,
    discount_type: "percentage",
    discount_value: 0,
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const groupedPrices = useMemo(() => {
    const grouped: Record<string, PriceSetting[]> = {};
    for (const item of priceSettings) {
      const setupName = item.setups?.display_name || "Unknown";
      if (!grouped[setupName]) grouped[setupName] = [];
      grouped[setupName].push(item);
    }
    return grouped;
  }, [priceSettings]);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/price-settings", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load settings");
      }

      const settings = (data.priceSettings || []) as PriceSetting[];
      setPriceSettings(settings);

      const nextPending: Record<string, number> = {};
      for (const item of settings) {
        nextPending[item.id] = item.base_price;
      }
      setPendingPrices(nextPending);

      setHCoinsSettings({
        coins_per_solo: Number(data.hCoinsSettings?.coins_per_solo ?? 10),
        coins_per_duo: Number(data.hCoinsSettings?.coins_per_duo ?? 15),
        coins_per_squad: Number(data.hCoinsSettings?.coins_per_squad ?? 25),
        coins_for_free_session: Number(data.hCoinsSettings?.coins_for_free_session ?? 100),
      });

      setSaleSettings({
        enabled: Boolean(data.saleSettings?.enabled),
        discount_type: data.saleSettings?.discount_type === "fixed" ? "fixed" : "percentage",
        discount_value: Number(data.saleSettings?.discount_value ?? 0),
        start_date: data.saleSettings?.start_date || "",
        end_date: data.saleSettings?.end_date || "",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to load settings";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }

  async function updatePrice(id: string) {
    const nextPrice = Number(pendingPrices[id]);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      setMessage({ type: "error", text: "Price must be a non-negative number" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/price-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "price_update",
        data: { priceSettingId: id, newPrice: nextPrice },
      }),
    });

    if (response.ok) {
      setMessage({ type: "success", text: "Price updated successfully" });
      await fetchSettings();
    } else {
      const json = await response.json().catch(() => ({}));
      setMessage({ type: "error", text: json?.error || "Failed to update price" });
    }

    setSaving(false);
  }

  async function saveSaleSettings() {
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/price-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "sale_update",
        data: {
          enabled: saleSettings.enabled,
          discountType: saleSettings.discount_type,
          discountValue: saleSettings.discount_value,
          startDate: saleSettings.start_date || null,
          endDate: saleSettings.end_date || null,
        },
      }),
    });

    if (response.ok) {
      setMessage({ type: "success", text: "Sale settings saved successfully" });
      await fetchSettings();
    } else {
      const json = await response.json().catch(() => ({}));
      setMessage({ type: "error", text: json?.error || "Failed to save sale settings" });
    }

    setSaving(false);
  }

  async function cancelSale() {
    if (!window.confirm("Cancel the sale and revert all prices back to their base values?")) {
      return;
    }

    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/price-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cancel_sale" }),
    });

    if (response.ok) {
      setMessage({ type: "success", text: "Sale cancelled. All prices reverted to base prices." });
      setSaleSettings((prev) => ({
        ...prev,
        enabled: false,
        discount_value: 0,
        start_date: "",
        end_date: "",
      }));
      await fetchSettings();
    } else {
      const json = await response.json().catch(() => ({}));
      setMessage({ type: "error", text: json?.error || "Failed to cancel sale" });
    }

    setSaving(false);
  }

  async function saveHCoinsSettings() {
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/price-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "h_coins_update",
        data: {
          coinsPerSolo: hCoinsSettings.coins_per_solo,
          coinsPerDuo: hCoinsSettings.coins_per_duo,
          coinsPerSquad: hCoinsSettings.coins_per_squad,
          coinsForFreeSession: hCoinsSettings.coins_for_free_session,
        },
      }),
    });

    if (response.ok) {
      setMessage({ type: "success", text: "H Coins settings saved successfully" });
      await fetchSettings();
    } else {
      const json = await response.json().catch(() => ({}));
      setMessage({ type: "error", text: json?.error || "Failed to save H Coins settings" });
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#ff5200]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF4500]">SETTINGS</div>
        <h1 className="mt-3 font-heading text-[48px] uppercase leading-none text-[#F5F1EA]">PRICE SETTINGS</h1>
        <p className="mt-2 text-sm text-[#A0A6AF]">Manage setup pricing, sales, and H Coins from one place.</p>
      </div>

      {message ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-500"
              : "border-red-500/30 bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#FF4500]">Sale Status</div>
            <h2 className="mt-2 text-[22px] font-semibold text-[#F5F1EA]">
              {saleSettings.enabled ? "SALE ACTIVE" : "No active sale"}
            </h2>
            <p className="mt-1 text-sm text-[#A0A6AF]">
              {saleSettings.enabled
                ? `${saleSettings.discount_value}% discount is currently applied to the stored price rows.`
                : "Prices are running at their base values."}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveSaleSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#ff5200] px-4 py-2 text-white transition hover:bg-[#cc2200] disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Sale
            </button>
            {saleSettings.enabled ? (
              <button
                type="button"
                onClick={cancelSale}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Cancel Sale
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-[#F5F1EA]">
          <Tag className="h-5 w-5 text-[#ff5200]" /> Setup Prices
        </h2>

        {Object.entries(groupedPrices).map(([setupName, prices]) => (
          <div key={setupName} className="mb-6 last:mb-0">
            <h3 className="mb-3 text-[#F5F1EA]">{setupName}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {prices.map((price) => {
                const sessionName = price.session_types?.name;
                const sessionLabel =
                  sessionName === "Solo"
                    ? "1 Player"
                    : sessionName === "Duo"
                      ? "2 Players"
                      : sessionName === "Squad"
                        ? "4 Players"
                        : sessionName || "Session";

                return (
                  <div key={price.id} className="rounded-xl bg-[#0A0F18] p-4">
                    <div className="mb-2 text-sm text-[#A0A6AF]">{sessionLabel}</div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-2xl font-bold text-[#ff5200]">Rs. {price.current_price}</span>
                      {price.current_price !== price.base_price ? (
                        <span className="text-sm text-[#A0A6AF] line-through">Rs. {price.base_price}</span>
                      ) : null}
                      {price.current_price !== price.base_price ? (
                        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-500">
                          SALE ACTIVE
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={pendingPrices[price.id] ?? price.base_price}
                        onChange={(e) =>
                          setPendingPrices((prev) => ({
                            ...prev,
                            [price.id]: Number(e.target.value || 0),
                          }))
                        }
                        className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-3 py-2 text-sm text-white outline-none focus:border-[#ff5200]"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => updatePrice(price.id)}
                        className="rounded-lg bg-[#ff5200] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#cc2200] disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-[#F5F1EA]">
          <Percent className="h-5 w-5 text-[#ff5200]" /> Sale / Discount
        </h2>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={saleSettings.enabled}
              onChange={(e) => setSaleSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="h-4 w-4 accent-[#ff5200]"
            />
            <span className="text-[#F5F1EA]">Enable Sale Mode</span>
          </label>

          {saleSettings.enabled ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[#A0A6AF]">Discount Type</label>
                <select
                  value={saleSettings.discount_type}
                  onChange={(e) =>
                    setSaleSettings((prev) => ({
                      ...prev,
                      discount_type: e.target.value === "fixed" ? "fixed" : "percentage",
                    }))
                  }
                  className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs.)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#A0A6AF]">Discount Value</label>
                <input
                  type="number"
                  min={0}
                  value={saleSettings.discount_value}
                  onChange={(e) =>
                    setSaleSettings((prev) => ({
                      ...prev,
                      discount_value: Number(e.target.value || 0),
                    }))
                  }
                  className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#A0A6AF]">Start Date</label>
                <input
                  type="date"
                  value={saleSettings.start_date}
                  onChange={(e) => setSaleSettings((prev) => ({ ...prev, start_date: e.target.value }))}
                  className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#A0A6AF]">End Date</label>
                <input
                  type="date"
                  value={saleSettings.end_date}
                  onChange={(e) => setSaleSettings((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
                />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={saveSaleSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#ff5200] px-4 py-2 text-white transition hover:bg-[#cc2200] disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Save Sale Settings
          </button>

          {saleSettings.enabled ? (
            <button
              type="button"
              onClick={cancelSale}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Cancel Sale
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[#14181F] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-[#F5F1EA]">
          <Coins className="h-5 w-5 text-[#ff5200]" /> H Coins Settings
        </h2>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[#A0A6AF]">Coins per Solo Booking</label>
            <input
              type="number"
              min={0}
              value={hCoinsSettings.coins_per_solo}
              onChange={(e) =>
                setHCoinsSettings((prev) => ({ ...prev, coins_per_solo: Number(e.target.value || 0) }))
              }
              className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A6AF]">Coins per Duo Booking</label>
            <input
              type="number"
              min={0}
              value={hCoinsSettings.coins_per_duo}
              onChange={(e) =>
                setHCoinsSettings((prev) => ({ ...prev, coins_per_duo: Number(e.target.value || 0) }))
              }
              className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A6AF]">Coins per Squad Booking</label>
            <input
              type="number"
              min={0}
              value={hCoinsSettings.coins_per_squad}
              onChange={(e) =>
                setHCoinsSettings((prev) => ({ ...prev, coins_per_squad: Number(e.target.value || 0) }))
              }
              className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A6AF]">Coins Needed for Free Session</label>
            <input
              type="number"
              min={0}
              value={hCoinsSettings.coins_for_free_session}
              onChange={(e) =>
                setHCoinsSettings((prev) => ({ ...prev, coins_for_free_session: Number(e.target.value || 0) }))
              }
              className="w-full rounded-lg border border-[#2A2F38] bg-[#050508] px-4 py-2 text-white outline-none focus:border-[#ff5200]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={saveHCoinsSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#ff5200] px-4 py-2 text-white transition hover:bg-[#cc2200] disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save H Coins Settings
        </button>
      </div>
    </div>
  );
}
