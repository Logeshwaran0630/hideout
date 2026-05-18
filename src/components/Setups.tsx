"use client";

import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

const setups = [
  {
    badge: "NEXT-GEN",
    title: "PlayStation 5",
    image: "/setups/playstation%205.jpg",
    description: "DualSense haptics, 4K @ 60fps, ray-traced worlds. Latest titles, always patched, always ready.",
    prices: [
      { label: "1 PLAYER", price: "₹150", unit: "/hr" },
      { label: "4 PLAYERS", price: "₹250", unit: "/hr" },
    ],
    badgeColor: "#00d4a0",
    accentColor: "#00d4a0",
  },
  {
    badge: "COUCH CO-OP",
    title: "PlayStation 4",
    image: "/setups/playstaion%204.jpg",
    description: "Classics that never aged - GTA V, God of War, FIFA nights. Two controllers, one couch, zero excuses.",
    prices: [
      { label: "1 PLAYER", price: "₹100", unit: "/hr" },
      { label: "4 PLAYERS", price: "₹200", unit: "/hr" },
    ],
    badgeColor: "#ff5200",
    accentColor: "#ff5200",
  },
  {
    badge: "OG VIBES",
    title: "Vintage Arcade",
    image: "/setups/arcade%20cabinet.jpg",
    description: "Mortal Kombat, Street Fighter, Tekken on the original cabinet. Coin-op feel without the coins.",
    prices: [
      { label: "1 PLAYER", price: "₹50", unit: "/hr" },
      { label: "2 PLAYERS", price: "₹80", unit: "/hr" },
    ],
    badgeColor: "#ff5200",
    accentColor: "#ff5200",
  },
  {
    badge: "FULL SEND",
    title: "Sim Racing Rig",
    image: "/setups/racing%20simulator%20kit.avif",
    description: "Force-feedback wheel, pedals, bucket seat. Forza, Gran Turismo, Assetto Corsa - feel every kerb.",
    prices: [
      { label: "5 LAPS", price: "₹50", unit: "" },
      { label: "30 MINS", price: "₹100", unit: "" },
    ],
    badgeColor: "#00d4a0",
    accentColor: "#00d4a0",
  },
];

export default function Setups() {
  return (
    <section id="setups" className="bg-dark-bg px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-title font-black uppercase text-white md:text-5xl">Setups Built To Impress</h2>
            <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-linear-to-r from-devil-orange to-ghost-teal" />
            <p className="mx-auto max-w-2xl text-[#FFFFFF]/60">
              Four fully-kitted zones, every one with premium gear. Walk in, sit down, press start.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {setups.map((setup, index) => (
            <ScrollReveal key={setup.title} delay={index * 100}>
              <article className="overflow-hidden rounded-[22px] border border-[rgba(255,82,0,0.16)] bg-card-bg shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,212,160,0.28)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[rgba(255,82,0,0.14)]">
                  <Image src={setup.image} alt={setup.title} fill className="object-cover" />
                </div>

                <div className="h-[3px] w-full" style={{ backgroundColor: setup.accentColor }} />

                <div className="p-6">
                  <span className="text-xs font-bold tracking-[0.2em]" style={{ color: setup.badgeColor }}>
                    {setup.badge}
                  </span>
                  <h3 className="mt-3 text-3xl font-title font-black tracking-tight text-white">{setup.title}</h3>

                  <p className="mt-4 min-h-[108px] text-[0.95rem] leading-relaxed text-white/60">{setup.description}</p>

                  <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-[rgba(255,82,0,0.16)] bg-[rgba(5,5,8,0.9)]">
                    {setup.prices.map((price, i) => (
                      <div
                        key={price.label}
                        className="px-3 py-3 text-center"
                        style={{ borderLeft: i === 1 ? "1px solid rgba(255,82,0,0.14)" : "none" }}
                      >
                        <div className="text-[0.72rem] tracking-[0.18em] text-ghost-teal/80">{price.label}</div>
                        <div className="mt-1 text-[2.05rem] font-black leading-none text-devil-orange glow-orange">{price.price}</div>
                        {price.unit && <div className="mt-1 text-sm text-white/45">{price.unit}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
