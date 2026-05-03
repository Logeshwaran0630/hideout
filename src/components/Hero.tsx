"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import GlitchText from "./GlitchText";
import ScrollReveal from "./ScrollReveal";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#A855F7]/20 blur-[120px] will-change-transform"
      />
      <motion.div
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-[#3B82F6]/12 blur-[100px] will-change-transform"
      />
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED]/8 blur-[130px] will-change-transform"
      />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-2/3 left-1/3 h-60 w-60 rounded-full bg-[#EC4899]/8 blur-[90px] will-change-transform"
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="fade-in rounded-xl border border-[#2A2A2A] bg-[#18181B]/80 px-6 py-4 backdrop-blur-sm"
          >
            <Image
              src="/logo.png"
              alt="The Hideout"
              width={420}
              height={120}
              style={{ width: "auto", height: "100px" }}
              priority
            />
          </motion.div>

          <ScrollReveal delay={100}>
            <p className="fade-up delay-1 mt-8 rounded-full border border-[#A855F7]/25 bg-[#A855F7]/10 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.15em] text-[#A855F7]">
              CHENNAI'S PREMIER GAMING LOUNGE
            </p>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <h1 className="fade-up delay-2 mt-5 max-w-5xl font-display text-[48px] font-black uppercase leading-[1.05] tracking-tight text-[#FFFFFF] md:text-[72px]">
              ESCAPE THE ORDINARY.
              <br />
              ENTER THE <GlitchText text="HIDEOUT" highlight />.
            </h1>
          </ScrollReveal>

          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 220 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="neon-divider mt-4 h-[2px]"
          />

          <ScrollReveal delay={320}>
            <p className="fade-up delay-3 mt-6 max-w-135 text-[18px] leading-relaxed text-[#A1A1AA]">
              Book a console, grab a couch, lose track of time. Real games, real setups, real vibes — no memberships, no fuss. Just press start.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={420}>
            <div className="fade-up delay-3 mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-4">
              <Link href="/slots" className="btn-primary rounded-lg px-8 py-3 text-[16px] font-semibold text-[#FFFFFF]">
                Book Your Slot
              </Link>
              <a href="https://wa.me/919876543210?text=Hi%20Hideout!%20I%20want%20to%20book%20a%20slot" target="_blank" rel="noopener noreferrer" className="btn-outline rounded-lg px-8 py-3 text-[16px] font-semibold text-[#FFFFFF]">
                Chat to Book
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={520}>
            <div className="fade-up delay-4 mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                { value: "10+", label: "Consoles" },
                { value: "50+", label: "Game Titles" },
                { value: "Midnight", label: "Open Till" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-[28px] font-semibold text-[#A855F7]">{stat.value}</div>
                  <div className="mt-1 text-[13px] text-[#A1A1AA]">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
