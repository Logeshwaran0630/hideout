"use client";

import ScrollReveal from "./ScrollReveal";
import Image from "next/image";

const setups = [
  {
    badge: "NEXT-GEN",
    title: "PLAYSTATION 5",
    image: "/setups/playstation%205.jpg",
    description: "DualSense haptics, 4K @ 60fps, ray-traced worlds. Latest titles, always patched, always ready.",
    prices: [
      { label: "1 PLAYER", price: "₹150", unit: "/hr" },
      { label: "4 PLAYERS", price: "₹250", unit: "/hr" },
    ],
    color: "#A855F7",
  },
  {
    badge: "COUCH CO-OP",
    title: "PLAYSTATION 4",
    image: "/setups/playstation%205.jpg",
    description: "Classics that never aged — GTA V, God of War, FIFA nights. Two controllers, one couch, zero excuses.",
    prices: [
      { label: "1 PLAYER", price: "₹100", unit: "/hr" },
      { label: "4 PLAYERS", price: "₹200", unit: "/hr" },
    ],
    color: "#06B6D4",
  },
  {
    badge: "OG VIBES",
    title: "VINTAGE ARCADE",
    image: "/setups/arcade%20cabinet.jpg",
    description: "Mortal Kombat, Street Fighter, Tekken on the original cabinet. Coin-op feel without the coins.",
    prices: [
      { label: "1 PLAYER", price: "₹50", unit: "/hr" },
      { label: "2 PLAYERS", price: "₹80", unit: "/hr" },
    ],
    color: "#EC4899",
  },
  {
    badge: "FULL SEND",
    title: "SIM RACING RIG",
    image: "/setups/racing%20simulator%20kit.avif",
    description: "Force-feedback wheel, pedals, bucket seat. Forza, Gran Turismo, Assetto Corsa — feel every curb.",
    prices: [
      { label: "5 LAPS", price: "₹50", unit: "" },
      { label: "30 MINS", price: "₹100", unit: "" },
    ],
    color: "#A855F7",
  },
];

export default function Setups() {
  return (
    <section id="setups" className="py-20 px-6 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">SETUPS BUILT TO IMPRESS</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#A855F7] to-[#06B6D4] mx-auto rounded-full mb-4" />
            <p className="text-[#A1A1AA] max-w-2xl mx-auto">
              Four fully-kitted zones, every one with premium gear. Walk in, sit down, press start.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {setups.map((setup, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="bg-[#18181B] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#A855F7]/50 transition-all hover:shadow-lg hover:shadow-[#A855F7]/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[#06B6D4] text-xs font-mono tracking-wider">{setup.badge}</span>
                    <h3 className="text-2xl font-bold text-white mt-1">{setup.title}</h3>
                  </div>
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={setup.image}
                      alt={setup.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                <p className="text-[#A1A1AA] text-sm leading-relaxed mb-4">{setup.description}</p>
                
                <div className="bg-[#0A0A0A] rounded-xl p-4">
                  {setup.prices.map((price, i) => (
                    <div key={i} className="flex justify-between items-center py-2 first:pt-0 last:pb-0 border-b border-[#2A2A2A] last:border-0">
                      <span className="text-sm text-[#A1A1AA]">{price.label}</span>
                      <div>
                        <span className="text-xl font-bold text-[#A855F7]">{price.price}</span>
                        <span className="text-sm text-[#A1A1AA] ml-1">{price.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
