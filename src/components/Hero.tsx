"use client";

import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(255,82,0,0.14),transparent_28%),radial-gradient(circle_at_50%_36%,rgba(0,212,160,0.08),transparent_22%),linear-gradient(180deg,rgba(5,5,8,0.25),rgba(5,5,8,0.82))]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="The Hideout"
            width={360}
            height={124}
            priority
            className="h-auto w-65 max-w-[78vw] drop-shadow-[0_0_24px_rgba(255,82,0,0.24)] md:w-85"
          />
        </div>

        <p className="font-cinzel text-sm uppercase tracking-[0.42em] text-ghost-teal/80 md:text-base">
          Console Lounge | Couches | Community
        </p>

        <h1 className="mt-6 max-w-4xl font-cinzel text-4xl uppercase leading-[0.92] text-white md:text-6xl lg:text-7xl">
          Escape The Ordinary.
        </h1>
        <h2 className="mt-3 max-w-4xl font-orbitron text-3xl font-black uppercase leading-[0.95] text-devil-orange glow-orange md:text-5xl lg:text-6xl">
          Enter The Hideout
        </h2>

        <p className="font-rajdhani mt-6 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
          Book a premium gaming slot, claim your couch, and play under a dark demonic glow. Same lounge, same booking flow, new infernal skin.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/slots" className="btn-primary px-8 py-3 text-lg font-bold uppercase tracking-[0.12em] text-white">
            Book Now
          </Link>
          <Link href="#pricing" className="btn-secondary px-8 py-3 text-lg font-bold uppercase tracking-[0.12em]">
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
