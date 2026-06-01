"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Send, Video } from "lucide-react";

const socialLinks = [
  { href: "https://instagram.com", label: "Instagram", Icon: Camera },
  { href: "https://x.com", label: "Twitter", Icon: Send },
  { href: "https://youtube.com", label: "YouTube", Icon: Video },
];

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,82,0,0.16)] bg-dark-bg">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo.png"
                alt="The Hideout"
                width={100}
                height={24}
                style={{ width: "auto", height: "24px" }}
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
              Chennai's after-hours gaming lounge. Book a slot. Show up. Play.
            </p>
            <div className="mt-5 flex items-center gap-4">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-white/60 transition-colors duration-200 hover:text-ghost-teal"
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
              Navigate
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li><a href="#about" className="transition-colors hover:text-[#ff5200]">About</a></li>
              <li><a href="#games" className="transition-colors hover:text-[#ff5200]">Games</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-[#ff5200]">Pricing</a></li>
              <li><Link href="/slots" className="transition-colors hover:text-[#ff5200]">Book a Slot</Link></li>
              <li><a href="https://wa.me/919344839372" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#ff5200]">WhatsApp</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
              Find Us
            </h3>
            <div className="mt-4 space-y-2 text-sm text-[#A0A6AF]">
              <p className="leading-relaxed">
                No. 5, Eswari Avenue,<br />
                Kovilpathagai, AVADI,<br />
                Chennai - 600062
              </p>
              <a
                href="https://maps.app.goo.gl/74HoqaH1YRUGZdWE8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#ff5200] hover:underline"
              >
                📍 Open in Google Maps
              </a>
              <p className="mt-2">🕐 Open 11 AM – Midnight</p>
              <a href="mailto:info@thehideout.in" className="block transition hover:text-[#ff5200]">
                info@thehideout.in
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[rgba(255,82,0,0.16)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/60">
            2024 The Hideout. All rights reserved.
          </p>
          <p className="text-xs text-white/40">Built in Chennai</p>
        </div>
      </div>
    </footer>
  );
}
