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
    <footer className="bg-[#0A0A0A] border-t border-[#2A2A2A]">
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
            <p className="mt-3 max-w-sm text-sm text-[#A1A1AA] leading-relaxed">
              Chennai's after-hours gaming lounge. Book a slot. Show up. Play.
            </p>
            <div className="mt-5 flex items-center gap-4">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-[#A1A1AA] transition-colors duration-200 hover:text-[#A855F7]"
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#FFFFFF]">
              Navigate
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#A1A1AA]">
              <li><a href="#about" className="transition-colors hover:text-[#FFFFFF]">About</a></li>
              <li><a href="#games" className="transition-colors hover:text-[#FFFFFF]">Games</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-[#FFFFFF]">Pricing</a></li>
              <li><Link href="/slots" className="transition-colors hover:text-[#FFFFFF]">Book a Slot</Link></li>
              <li><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#FFFFFF]">WhatsApp</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#FFFFFF]">
              Find Us
            </h3>
            <div className="mt-4 space-y-3 text-sm text-[#A1A1AA]">
              <p>Chennai, Tamil Nadu</p>
              <p>Open 11 AM – Midnight</p>
              <a href="mailto:info@thehideout.in" className="transition-colors hover:text-[#A855F7]">
                info@thehideout.in
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#2A2A2A] pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#A1A1AA]">
            © 2024 The Hideout. All rights reserved.
          </p>
          <p className="text-xs text-[#6B6B6B]">Built with ♥ in Chennai</p>
        </div>
      </div>
    </footer>
  );
}