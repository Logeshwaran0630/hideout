"use client";

import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import { CheckCircle } from "lucide-react";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-6 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">SIMPLE & FAIR</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#A855F7] to-[#06B6D4] mx-auto rounded-full mb-4" />
          <p className="text-[#A1A1AA] mb-8">No hidden fees. No upsells. Pay for your time, show up, and play.</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="bg-gradient-to-r from-[#A855F7]/10 to-[#06B6D4]/10 rounded-2xl p-8 mb-8 border border-[#2A2A2A]">
            <p className="text-[#A1A1AA] text-sm uppercase tracking-wider mb-2">SESSIONS STARTING AT</p>
            <div className="text-6xl md:text-7xl font-bold text-[#A855F7] mb-2">₹50</div>
            <p className="text-xl text-white mb-4">/onwards</p>
            <p className="text-[#A1A1AA] max-w-md mx-auto">
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
              className="px-6 py-3 rounded-lg border-2 border-[#06B6D4] text-[#06B6D4] font-semibold hover:bg-[#06B6D4]/10 transition-all"
            >
              Message Us for Full Pricing
            </a>
            <Link href="/slots" className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white font-semibold hover:scale-105 transition-transform">
              Book Online →
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm">
            {["H Coins on every session", "Group & squad rates", "Weekday off-peak deals"].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-[#A1A1AA]">
                <CheckCircle className="w-4 h-4 text-[#06B6D4]" />
                {benefit}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
