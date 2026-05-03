"use client";

import Link from "next/link";
import AnimatedBorder from "./AnimatedBorder";
import ScrollReveal from "./ScrollReveal";
import TiltCard from "./TiltCard";

const plans = [
  { name: "Solo", price: 199, players: 1, features: ["Any console", "Headset included", "1 hr session"], popular: false },
  { name: "Duo", price: 349, players: 2, features: ["Split consoles", "2 headsets", "Perfect for couples"], popular: true },
  { name: "Squad", price: 599, players: 4, features: ["All consoles", "Bonus H Coins", "Best value"], popular: false },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[#0A0A0A] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <span className="text-sm uppercase tracking-wider text-[#A855F7]">Pricing</span>
            <h2 className="mt-2 font-display text-4xl font-black uppercase tracking-tight md:text-5xl">Simple. Transparent.</h2>
            <div className="neon-divider mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#A855F7] to-[#3B82F6]" />
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <ScrollReveal key={plan.name} delay={index * 120} type="scale">
              <TiltCard>
                <AnimatedBorder>
                  <div className={`card-premium relative rounded-2xl p-8 text-center ${plan.popular ? "border-[#A855F7]/50 glow-purple" : ""}`}>
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#EC4899] px-4 py-1 text-xs font-bold text-white">
                        POPULAR
                      </span>
                    )}
                    <h3 className="font-heading text-2xl font-bold text-[#FFFFFF]">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-[#A855F7]">₹{plan.price}</span>
                      <span className="text-[#A1A1AA]">/hr</span>
                    </div>
                    <p className="mt-2 text-sm text-[#A1A1AA]">Up to {plan.players} player(s)</p>
                    <ul className="mt-6 space-y-2 text-left">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                          <span className="text-[#3B82F6]">✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href="/slots" className="btn-primary mt-8 block w-full rounded-lg px-4 py-2.5 text-center font-semibold text-[#FFFFFF]">
                      Book Now
                    </Link>
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
