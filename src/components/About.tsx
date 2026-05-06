"use client";

import AnimatedBorder from "./AnimatedBorder";
import ScrollReveal from "./ScrollReveal";
import TiltCard from "./TiltCard";

export default function About() {
  return (
    <section id="about" className="bg-[#0A0A0A] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <span className="text-sm uppercase tracking-wider text-[#A855F7]">About Us</span>
            <h2 className="mt-2 font-display text-4xl font-black uppercase tracking-tight md:text-5xl">Welcome to The Hideout</h2>
            <div className="neon-divider mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#A855F7] to-[#3B82F6]" />
          </div>
        </ScrollReveal>

        <div className="grid items-center gap-12 md:grid-cols-2">
          <ScrollReveal>
            <div>
              <p className="mb-4 leading-relaxed text-[#A1A1AA]">
                The Hideout is Chennai's premier after-hours gaming lounge, designed for gamers who demand the best equipment and atmosphere.
              </p>
              <p className="leading-relaxed text-[#A1A1AA]">
                Whether you're grinding ranked matches, hosting a squad, or just looking for a place to unwind — we've got you covered with premium consoles, comfortable seating, and midnight hours.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Premium Equipment", image: "/aboutus/racing%20simulator%20kit.avif" },
              { label: "Modern Controls", image: "/aboutus/mordern%20controls.jpeg" },
              { label: "Audio Gear", image: "/aboutus/audio%20gear.webp" },
              { label: "Tournaments", image: "/aboutus/tournaments.jpg" },
            ].map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 100}>
                <TiltCard>
                  <AnimatedBorder>
                    <div className="card-premium rounded-xl p-6 text-center">
                      <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-[#18181B] text-[#6B6B6B]">
                        <img src={item.image} alt={item.label} className="h-full w-full rounded-lg object-cover" />
                      </div>
                      <div className="text-sm text-[#A1A1AA]">{item.label}</div>
                    </div>
                  </AnimatedBorder>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
