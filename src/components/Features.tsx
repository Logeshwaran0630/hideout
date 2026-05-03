"use client";

import AnimatedBorder from "./AnimatedBorder";
import ScrollReveal from "./ScrollReveal";
import TiltCard from "./TiltCard";

const features = [
  {
    title: "INSTANT BOOKING",
    description: "No calls, no queues. Pick a date, pick a slot, you're in. Confirmation hits your inbox in under 10 seconds."
  },
  {
    title: "H COINS LOYALTY",
    description: "Earn 10 H Coins every booking. Stack 100 and your next session is on us. Gaming that pays you back."
  },
  {
    title: "WHATSAPP CONCIERGE",
    description: "Prefer texting? Drop us a message — our booking assistant handles the rest. Confirm, reschedule, ask anything."
  },
  {
    title: "SQUAD TOURNAMENTS",
    description: "Friday night Tekken brackets. Saturday FIFA leagues. Win H Coins, bragging rights, and the occasional trophy."
  },
  {
    title: "SNACK BAR & ENERGY",
    description: "Cold drinks, hot maggi, the kind of caffeine that fuels overtime. Order from your seat, no pause needed."
  },
  {
    title: "WALK-IN FRIENDLY",
    description: "No membership fees, no minimums. Show up solo, bring your squad, or meet new ones. The door's open."
  }
];

export default function Features() {
  return (
    <section id="features" className="bg-[#0A0A0A] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <span className="text-sm uppercase tracking-wider text-[#EC4899]">Why Choose Us</span>
            <h2 className="mt-2 font-display text-4xl font-black uppercase tracking-tight md:text-5xl">MORE THAN JUST GAMING</h2>
            <div className="neon-divider mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899]" />
            <p className="mx-auto mt-4 max-w-2xl text-[#A1A1AA]">
              We sweat the details so your session is flawless from the moment you walk in.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 90} type="scale">
              <TiltCard>
                <AnimatedBorder>
                  <div className="card-premium rounded-xl p-6 transition-all hover:glow-blue">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-xl font-bold text-[#3B82F6]">{(index + 1).toString().padStart(2, "0")}</span>
                      <h3 className="font-heading text-lg font-bold text-[#FFFFFF]">{feature.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-[#A1A1AA]">{feature.description}</p>
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
