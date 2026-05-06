"use client";

import Image from "next/image";
import AnimatedBorder from "./AnimatedBorder";
import ScrollReveal from "./ScrollReveal";
import TiltCard from "./TiltCard";

const games = [
  { name: "EA FC 25", category: "Sports", image: "/games/ea fc 24.avif" },
  { name: "GTA V", category: "Action", image: "/games/gta 5.jpg" },
  { name: "Call of Duty", category: "Shooter", image: "/games/call of duty.jpg" },
  { name: "F1 24", category: "Racing", image: "/games/f1 24.jpg" },
  { name: "Fortnite", category: "Battle Royale", image: "/games/fortnite.avif" },
  { name: "Valorant", category: "Tactical", image: "/games/valorant.jpg" },
];

export default function Games() {
  return (
    <section id="games" className="bg-[#0A0A0A] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <span className="text-sm uppercase tracking-wider text-[#A855F7]">Game Library</span>
            <h2 className="mt-2 font-display text-4xl font-black uppercase tracking-tight md:text-5xl">Choose Your Battle</h2>
            <div className="neon-divider mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899]" />
            <p className="mx-auto mt-4 max-w-2xl text-[#A1A1AA]">50+ titles available across all consoles</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {games.map((game, index) => (
            <ScrollReveal key={game.name} delay={index * 80} type="scale">
              <TiltCard>
                <AnimatedBorder>
                  <div className="card-premium rounded-xl p-6 text-center transition-all hover:glow-purple">
                    <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-lg bg-[#18181B]">
                      <Image
                        src={game.image}
                        alt={game.name}
                        width={150}
                        height={150}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-semibold text-[#FFFFFF]">{game.name}</div>
                    <div className="mt-1 text-xs text-[#6B6B6B]">{game.category}</div>
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
