"use client";

import ScrollReveal from "./ScrollReveal";

const features = [
  { number: "01", title: "Instant Booking", description: "No calls, no queues. Pick a date, pick a slot, you're in. Confirmation hits your inbox in under 10 seconds." },
  { number: "02", title: "H Coins Loyalty", description: "Earn 10 H Coins every booking. Stack 100 and your next session is on us. Gaming that pays you back." },
  { number: "03", title: "WhatsApp Concierge", description: "Prefer texting? Drop us a message — our booking assistant handles the rest. Confirm, reschedule, ask anything." },
  { number: "04", title: "Squad Tournaments", description: "Friday night Tekken brackets. Saturday FIFA leagues. Win H Coins, bragging rights, and trophies." },
  { number: "05", title: "Snack Bar & Energy", description: "Cold drinks, hot maggi, the kind of caffeine that fuels overtime. Order from your seat, no pause needed." },
  { number: "06", title: "Walk-in Friendly", description: "No membership fees, no minimums. Show up solo, bring your squad, or meet new ones. The door's open." },
];

export default function Features() {
  return (
    <section id="features" className="bg-dark-bg px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-title font-black uppercase text-white md:text-5xl">More Than Just Gaming</h2>
            <div className="mx-auto mb-4 h-1 w-24 rounded-full bg-linear-to-r from-[#ff5200] to-[#cc2200]" />
            <p className="mx-auto max-w-2xl text-white/60">
              We sweat the details so your session is flawless from the moment you walk in.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="rounded-xl border border-[rgba(255,82,0,0.16)] bg-card-bg p-6 transition-all hover:border-[rgba(0,212,160,0.34)] hover:shadow-[0_0_24px_rgba(0,212,160,0.08)]">
                <div className="mb-3 text-4xl font-bold text-[#ff5200] glow-orange">{feature.number}</div>
                <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
