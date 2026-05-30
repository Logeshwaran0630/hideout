"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function PricingSection() {
  const [startingPrice, setStartingPrice] = useState(50);

  useEffect(() => {
    let isActive = true;

    const fetchStartingPrice = async () => {
      const { data } = await supabase
        .from("price_settings")
        .select("current_price")
        .order("current_price", { ascending: true })
        .limit(1)
        .single();

      if (!isActive) return;
      if (typeof data?.current_price === "number") {
        setStartingPrice(data.current_price);
      }
    };

    fetchStartingPrice();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section id="pricing" className="bg-dark-bg px-6 py-20">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="mb-4 text-4xl font-title font-black uppercase text-white md:text-5xl">Simple & Fair</h2>
          <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-linear-to-r from-devil-orange to-ghost-teal" />
          <p className="mb-8 text-white/60">No hidden fees. No upsells. Pay for your time, show up, and play.</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="mb-8 rounded-2xl border border-[rgba(255,82,0,0.18)] bg-card-bg p-8">
            <p className="mb-2 text-sm uppercase tracking-wider text-devil-orange">Sessions Starting At</p>
            <div className="price-text mb-2 text-6xl font-bold glow-orange md:text-7xl">₹{startingPrice}</div>
            <p className="mb-4 text-xl text-devil-orange/80">/onwards</p>
            <p className="mx-auto max-w-md text-white/60">
              Pricing varies by station, group size, and time of day. For session bundles, group rates, and tournament packages — chat with us.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a 
              href="https://wa.me/919876543210?text=Hi%20Hideout!%20I%20want%20pricing%20details"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-6 py-3 font-semibold"
            >
              Message Us for Full Pricing
            </a>
            <Link href="/slots" className="btn-primary px-6 py-3 font-semibold text-white">
              Book Online →
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm">
            {["H Coins on every session", "Group & squad rates", "Weekday off-peak deals"].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-white/60">
                <CheckCircle className="w-4 h-4 text-ghost-teal" />
                {benefit}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
