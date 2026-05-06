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
    <section id="features" className="py-20 px-6 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">MORE THAN JUST GAMING</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#A855F7] to-[#06B6D4] mx-auto rounded-full mb-4" />
            <p className="text-[#A1A1AA] max-w-2xl mx-auto">
              We sweat the details so your session is flawless from the moment you walk in.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="bg-[#18181B] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#06B6D4]/50 transition-all hover:shadow-lg hover:shadow-[#06B6D4]/5">
                <div className="text-4xl font-bold text-[#06B6D4] mb-3">{feature.number}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#A1A1AA] text-sm leading-relaxed">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
