"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Tag } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { supabase } from "@/lib/supabase/client";

type SetupCard = {
  badge: string;
  setupName: string;
  title: string;
  image: string;
  description: string;
  fallbackPrices: Record<string, number>;
  badgeColor: string;
  accentColor: string;
};

const setups: SetupCard[] = [
  {
    badge: "NEXT-GEN",
    setupName: "ps5",
    title: "PlayStation 5",
    image: "/new%20setup/ps5.png",
    description: "DualSense haptics, 4K @ 60fps, ray-traced worlds. Latest titles, always patched, always ready.",
    fallbackPrices: { Solo: 150, Duo: 250, Squad: 350 },
    badgeColor: "#00d4a0",
    accentColor: "#00d4a0",
  },
  {
    badge: "COUCH CO-OP",
    setupName: "ps4",
    title: "PlayStation 4",
    image: "/new%20setup/ps4.png",
    description: "Classics that never aged - GTA V, God of War, FIFA nights. Two controllers, one couch, zero excuses.",
    fallbackPrices: { Solo: 100, Duo: 180, Squad: 250 },
    badgeColor: "#ff5200",
    accentColor: "#ff5200",
  },
  {
    badge: "ULTIMATE RIG",
    setupName: "pc",
    title: "PC Gaming",
    image: "/new%20setup/pc%20gaming.png",
    description: "RTX gaming PC with 240Hz display, mechanical keyboard, and precision mouse.",
    fallbackPrices: { Solo: 150, Duo: 250, Squad: 350 },
    badgeColor: "#A855F7",
    accentColor: "#A855F7",
  },
  {
    badge: "OG VIBES",
    setupName: "arcade",
    title: "Vintage Arcade",
    image: "/new%20setup/arcade.png",
    description: "Mortal Kombat, Street Fighter, Tekken on the original cabinet. Coin-op feel without the coins.",
    fallbackPrices: { Solo: 50, Duo: 80, Squad: 120 },
    badgeColor: "#ff5200",
    accentColor: "#ff5200",
  },
  {
    badge: "FULL SEND",
    setupName: "racing",
    title: "Sim Racing Rig",
    image: "/new%20setup/racing%20sim.png",
    description: "Force-feedback wheel, pedals, bucket seat. Forza, Gran Turismo, Assetto Corsa - feel every kerb.",
    fallbackPrices: { "30 Minutes": 100, "10 Laps": 100 },
    badgeColor: "#00d4a0",
    accentColor: "#00d4a0",
  },
];

type PriceRow = {
  setup_id: string;
  current_price: number;
  is_sale?: boolean;
  discount_percentage?: number | null;
  setups?: { name: string } | { name: string }[];
  session_types?: { name: string } | { name: string }[];
};

export default function Setups() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saleActive, setSaleActive] = useState(false);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
    const { data } = await supabase
      .from("price_settings")
      .select("setup_id, current_price, is_sale, discount_percentage, setups(name), session_types(name)");

    if (!data) {
      return;
    }

    const priceMap: Record<string, number> = {};
    let activeSale = false;
    let discount = 0;

    for (const item of data as PriceRow[]) {
      const setupRelation = item.setups;
      const sessionRelation = item.session_types;
      const setupName = Array.isArray(setupRelation) ? setupRelation[0]?.name : setupRelation?.name;
      const sessionName = Array.isArray(sessionRelation) ? sessionRelation[0]?.name : sessionRelation?.name;
      if (!setupName || !sessionName) continue;

      priceMap[`${setupName}_${sessionName}`] = item.current_price;

      if (item.is_sale) {
        activeSale = true;
        discount = Number(item.discount_percentage ?? discount ?? 0);
      }
    }

    setPrices(priceMap);
    setSaleActive(activeSale);
    setSaleDiscount(discount);
  };

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      if (!active) return;
      setLoading(true);
      try {
        await fetchAllData();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    const channel = supabase
      .channel("price-settings-live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "price_settings" }, () => {
        fetchAllData().catch(() => undefined);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "global_settings" }, () => {
        fetchAllData().catch(() => undefined);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      setLoading(true);
      await fetchAllData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupCards = useMemo(
    () =>
      setups.map((setup) => ({
        ...setup,
        prices: (setup.setupName === "racing" ? ["30 Minutes", "10 Laps"] : ["Solo", "Duo", "Squad"]).map((sessionName) => {
          const dynamicPrice = prices[`${setup.setupName}_${sessionName}`];
          const fallback = setup.fallbackPrices[sessionName];
          return {
            label: sessionName.toUpperCase(),
            price: `₹${typeof dynamicPrice === "number" ? dynamicPrice : fallback}`,
            unit: setup.setupName === "racing" ? "" : "/hr",
          };
        }),
      })),
    [prices]
  );

  return (
    <section id="setups" className="bg-dark-bg px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-12 flex flex-col gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <h2 className="mb-4 text-4xl font-title font-black uppercase text-white md:text-5xl">Setups Built To Impress</h2>
              <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-linear-to-r from-devil-orange to-ghost-teal md:mx-0" />
              <p className="mx-auto max-w-2xl text-[#FFFFFF]/60 md:mx-0">
                Four fully-kitted zones, every one with premium gear. Walk in, sit down, press start.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshPrices}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2F38] bg-[#0A0F18] px-4 py-2 text-sm font-medium text-[#A0A6AF] transition hover:border-devil-orange hover:text-white disabled:opacity-50"
              title="Refresh prices"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Prices
            </button>
          </div>
        </ScrollReveal>

        {saleActive ? (
          <ScrollReveal delay={50}>
            <div className="mb-8 flex flex-col gap-2 rounded-2xl border border-devil-orange/30 bg-devil-orange/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-devil-orange" />
                <div>
                  <div className="font-semibold text-white">SALE ACTIVE</div>
                  <div className="text-sm text-[#A0A6AF]">
                    {saleDiscount > 0 ? `${saleDiscount}% off on all bookings` : "Discount applied on current prices"}
                  </div>
                </div>
              </div>
              <div className="text-sm text-[#A0A6AF]">Prices update automatically when admin changes them</div>
            </div>
          </ScrollReveal>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-devil-orange" />
          </div>
        ) : null}

        {/* Horizontal scroll on mobile/tablet, 5-column row on lg+ */}
        <div className="-mx-6 px-6 overflow-x-auto pb-6">
          <div className="flex gap-6 min-w-max lg:grid lg:grid-cols-5 lg:min-w-0">
            {setupCards.map((setup, index) => (
              <div key={setup.title} className="w-[320px] lg:w-auto shrink-0">
                <ScrollReveal delay={index * 100}>
                  <article className="h-full min-h-95 flex flex-col overflow-hidden rounded-[22px] border border-[rgba(255,82,0,0.16)] bg-card-bg shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,212,160,0.28)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                    <div className="relative aspect-video w-full overflow-hidden border-b border-[rgba(255,82,0,0.14)]">
                      <Image src={setup.image} alt={setup.title} fill className="object-cover" />
                    </div>

                    <div className="h-0.75 w-full" style={{ backgroundColor: setup.accentColor }} />

                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold tracking-[0.2em]" style={{ color: setup.badgeColor }}>
                          {setup.badge}
                        </span>
                        {saleActive ? (
                          <span className="rounded-full border border-devil-orange/30 bg-devil-orange/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.15em] text-devil-orange">
                            SALE ACTIVE
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-3xl font-title font-black tracking-tight text-white">{setup.title}</h3>

                      <p className="mt-4 min-h-27 text-[0.95rem] leading-relaxed text-white/60 line-clamp-3">{setup.description}</p>

                          <div
                            className={`mt-auto grid gap-2 overflow-hidden rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[rgba(5,5,8,0.9)] ${
                              setup.setupName === "racing" ? "grid-cols-2" : "grid-cols-3"
                            }`}
                          >
                            {setup.prices.map((price, i) => (
                              <div
                                key={price.label}
                                className="min-w-18 px-3 py-3 text-center flex flex-col items-center justify-center"
                                style={{ borderLeft: i > 0 ? "1px solid rgba(255,82,0,0.14)" : "none" }}
                              >
                                <div className="text-[0.72rem] tracking-[0.18em] text-ghost-teal/80">{price.label}</div>
                                <div className="mt-1 flex flex-col items-center">
                                  <span className="text-[1.4rem] font-black leading-none text-devil-orange glow-orange whitespace-nowrap">{price.price}</span>
                                  {price.unit ? <span className="text-sm text-white/45 mt-1">{price.unit}</span> : null}
                                </div>
                              </div>
                            ))}
                          </div>
                    </div>
                  </article>
                </ScrollReveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
