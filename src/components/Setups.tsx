"use client";

import AnimatedBorder from "./AnimatedBorder";
import ScrollReveal from "./ScrollReveal";
import TiltCard from "./TiltCard";

const setups = [
  {
    title: "PICK YOUR STATION",
    name: "PLAYSTATION 5",
    description: "DualSense haptics, 4K @ 60fps, ray-traced worlds, Latest titles, always patched, always ready.",
    price: "₹250",
    image: "/setups/playstation%205.jpg",
  },
  {
    title: "CO-OP COUCH",
    name: "VR GAMING",
    description: "Meta Quest 3 + full body tracking, haptic feedback vest, 3D spatial audio. Step inside your favorite games.",
    price: "₹299",
    image: "/setups/vr%20gaming.jpg",
  },
  {
    title: "VINTAGE ARCADE",
    name: "ARCADE CABINET",
    description: "Modern gaming experience. Modern controls. Modern gear. Walk in, sit down, press start.",
    price: "₹150",
    image: "/setups/arcade%20cabinet.jpg",
  },
  {
    title: "SIM RACING RIG",
    name: "RACING SIMULATOR",
    description: "Force-feedback wheel, pedals, bucket seat. Gran Turismo, Assetto Corsa — feel every curb.",
    price: "₹200",
    image: "/setups/racing%20simulator%20kit.avif",
  },
];

export default function Setups() {
  return (
    <section id="setups" className="relative bg-[#0A0A0A] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <span className="text-sm uppercase tracking-wider text-[#A855F7]">Premium Setups</span>
            <h2 className="mt-2 font-display text-4xl font-black uppercase tracking-tight md:text-5xl">SETUPS BUILT TO IMPRESS</h2>
            <div className="neon-divider mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#A855F7] to-[#3B82F6]" />
            <p className="mx-auto mt-4 max-w-2xl text-[#A1A1AA]">
              Four fully-kitted zones, every one with premium gear. Walk in, sit down, press start.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2">
          {setups.map((setup, index) => (
            <ScrollReveal key={setup.name} delay={index * 120} type="scale">
              <TiltCard>
                <AnimatedBorder>
                  <div className="card-premium rounded-2xl p-6 transition-all hover:glow-purple">
                    <div className="mb-6 flex h-40 items-center justify-center overflow-hidden rounded-lg bg-[#1A1A1A] text-[#6B6B6B]">
                      {setup.image ? <img src={setup.image} alt={setup.name} className="h-full w-full rounded-lg object-contain" /> : <span>Image Placeholder</span>}
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono tracking-wider text-[#A855F7]">{setup.title}</span>
                        <h3 className="mt-1 font-heading text-xl font-bold text-[#FFFFFF]">{setup.name}</h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">{setup.description}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-[#2A2A2A] pt-4">
                      <span className="text-2xl font-bold text-[#A855F7]">{setup.price}</span>
                      <span className="text-xs text-[#A1A1AA]">/hour</span>
                    </div>
                  </div>
                </AnimatedBorder>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
