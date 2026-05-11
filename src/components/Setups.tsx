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
    badgeColor: "#00E5FF",
    accentColor: "#00E5FF",
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
    badgeColor: "#FF2A9D",
    accentColor: "#FF2A9D",
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
    badgeColor: "#E6FF00",
    accentColor: "#E6FF00",
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
    badgeColor: "#FF5A1F",
    accentColor: "#FF5A1F",
  },
];

export default function Setups() {
  return (
    <section id="setups" className="bg-[#030311] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">SETUPS BUILT TO IMPRESS</h2>
            <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#A855F7] to-[#06B6D4]" />
            <p className="mx-auto max-w-2xl text-[#A1A1AA]">
              Four fully-kitted zones, every one with premium gear. Walk in, sit down, press start.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {setups.map((setup, index) => (
            <ScrollReveal key={setup.title} delay={index * 100}>
              <article className="overflow-hidden rounded-[22px] border border-[#2A2A4A] bg-[#09091C] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[#242448]">
                  <Image src={setup.image} alt={setup.title} fill className="object-cover" />
                </div>

                <div className="h-[3px] w-full" style={{ backgroundColor: setup.accentColor }} />

                <div className="p-6">
                  <span className="text-xs font-bold tracking-[0.2em]" style={{ color: setup.badgeColor }}>
                    {setup.badge}
                  </span>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-white">{setup.title}</h3>

                  <p className="mt-4 min-h-[108px] text-[0.95rem] leading-relaxed text-[#B6B6C7]">{setup.description}</p>

                  <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#2A2A4A] bg-[#0E0E21]">
                    {setup.prices.map((price, i) => (
                      <div
                        key={price.label}
                        className="px-3 py-3 text-center"
                        style={{ borderLeft: i === 1 ? "1px solid #2A2A4A" : "none" }}
                      >
                        <div className="text-[0.72rem] tracking-[0.18em] text-[#8B8BA7]">{price.label}</div>
                        <div className="mt-1 text-[2.05rem] font-black leading-none text-white">{price.price}</div>
                        {price.unit && <div className="mt-1 text-sm text-[#9A9AB5]">{price.unit}</div>}
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
